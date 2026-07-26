const LANGUAGE_CODES=Object.freeze({
  English:'en-US',French:'fr-FR',German:'de-DE',Italian:'it-IT',Portuguese:'pt-BR',
  Spanish:'es-MX',Korean:'ko-KR',Japanese:'ja-JP',Chinese:'zh-CN',Russian:'ru-RU',Arabic:'ar-SA'
});

export function speechRecognitionSupport(){
  const Constructor=globalThis.SpeechRecognition||globalThis.webkitSpeechRecognition;
  return{supported:Boolean(Constructor),Constructor};
}

export function speechLanguageCode(language){
  return LANGUAGE_CODES[language]||'';
}

export function recognizeGuidedSpeech(language,{timeout=12000}={}){
  const{supported,Constructor}=speechRecognitionSupport();
  if(!supported)return Promise.reject(Object.assign(new Error('Este navegador no ofrece reconocimiento de voz.'),{code:'unsupported'}));
  return new Promise((resolve,reject)=>{
    const recognition=new Constructor();
    let settled=false;
    const timer=setTimeout(()=>{try{recognition.stop();}catch{};finishReject('timeout','No escuché una respuesta. Inténtalo de nuevo.');},timeout);
    const cleanup=()=>clearTimeout(timer);
    const finishReject=(code,message)=>{if(settled)return;settled=true;cleanup();reject(Object.assign(new Error(message),{code}));};
    recognition.lang=speechLanguageCode(language);
    recognition.interimResults=false;
    recognition.continuous=false;
    recognition.maxAlternatives=5;
    recognition.onresult=event=>{
      if(settled)return;
      settled=true;
      cleanup();
      const alternatives=[...event.results[0]].map(result=>({transcript:result.transcript.trim(),confidence:Number(result.confidence||0)}));
      resolve({transcript:alternatives[0]?.transcript||'',alternatives});
    };
    recognition.onerror=event=>{
      const messages={
        'not-allowed':'Activa el permiso del micrófono para practicar pronunciación.',
        'audio-capture':'No se encontró un micrófono disponible.',
        'no-speech':'No escuché una respuesta. Inténtalo de nuevo.',
        network:'El reconocimiento de voz necesita conexión en este navegador.'
      };
      finishReject(event.error||'speech-error',messages[event.error]||'No pude reconocer la respuesta.');
    };
    recognition.onend=()=>{if(!settled)finishReject('no-speech','No escuché una respuesta. Inténtalo de nuevo.');};
    try{recognition.start();}catch(error){finishReject('start-error',error.message);}
  });
}
