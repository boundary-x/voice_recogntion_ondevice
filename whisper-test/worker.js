import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1';
env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;
let model;
self.onmessage = async ({data}) => {
 try {
  if(data.type === 'load') {
   if(!['tiny','base'].includes(data.model)) throw new Error('지원하지 않는 모델');
   model = await pipeline('automatic-speech-recognition','onnx-community/whisper-'+data.model,{
    device:'wasm',dtype:'q8',progress_callback:p=>self.postMessage({type:'progress',progress:p})
   });
   self.postMessage({type:'ready'});
  } else if(data.type === 'transcribe') {
   if(!model) throw new Error('모델이 준비되지 않았습니다');
   const start=performance.now();
   const result=await model(data.audio,{language:data.language,task:'transcribe',return_timestamps:false,max_new_tokens:64});
   self.postMessage({type:'result',text:result.text,ms:performance.now()-start});
  }
 } catch(e) { self.postMessage({type:'error',message:e.message || String(e)}); }
};
