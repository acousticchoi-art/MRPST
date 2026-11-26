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
    if(error)return {data:null,error:error.message||"Data query failed."};
    if(!Array.isArray(data)||count===null||count>10000||count<0|| (expected!==null&&count!==expected))return {data:null,error:"Incomplete or changed data. Please refresh."};
    expected=count;
    for(const row of data){
      if(typeof row.id!=="string"||ids.has(row.id))return {data:null,error:"Duplicate or invalid record. Please refresh."};
      ids.add(row.id);rows.push(row);
    }
    if(rows.length===expected)return {data:rows,error:null};
    if(data.length!==pageSize||rows.length>expected)return {data:null,error:"Incomplete data. Please refresh."};
  }
}

