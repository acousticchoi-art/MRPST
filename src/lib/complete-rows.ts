type QueryResult={data:any;error:string|null};
// Do not silently truncate totals or approvals at the PostgREST row limit.
// Stable unique ordering and exact counts catch incomplete/changing reads.
export async function allRows(fetchPage:(start:number,end:number)=>PromiseLike<{data:any;error:any;count:number|null}>):Promise<QueryResult>{
  const rows:any[]=[];
  const ids=new Set<string>();
  let expected:number|null=null;
  const pageSize=250;
  for(let start=0;;start+=pageSize){
    const {data,error,count}=await fetchPage(start,start+pageSize-1);
    if(error)return {data:null,error:error.message||"데이터 조회에 실패했습니다."};
    if(!Array.isArray(data)||count===null||count>10000||count<0|| (expected!==null&&count!==expected))return {data:null,error:"데이터가 일부 누락되었거나 변경되었습니다. 새로고침해 주세요."};
    expected=count;
    for(const row of data){
      if(typeof row.id!=="string"||ids.has(row.id))return {data:null,error:"중복되거나 올바르지 않은 기록이 있습니다. 새로고침해 주세요."};
      ids.add(row.id);rows.push(row);
    }
    if(rows.length===expected)return {data:rows,error:null};
    if(data.length!==pageSize||rows.length>expected)return {data:null,error:"데이터가 모두 조회되지 않았습니다. 새로고침해 주세요."};
  }
}

