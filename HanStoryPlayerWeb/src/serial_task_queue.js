// Owner transitions must finish before another transition reads local progress.
export class SerialTaskQueue {
  tail=Promise.resolve();
  run(task){
    const result=this.tail.then(task);
    this.tail=result.catch(()=>{});
    return result;
  }
}
