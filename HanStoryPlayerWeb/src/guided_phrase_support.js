const clean=value=>String(value??'').trim();

const wordFrom=item=>clean(typeof item==='string'?item:item?.text||item?.word||item?.target||item?.form);
const meaningFrom=item=>clean(item&&typeof item==='object'?(item.meaning||item.translation||item.gloss||item.label):'');

/**
 * Optional authoring support for sentence-level activities.  Keeping this
 * separate means a course can add precise glosses without the UI guessing a
 * translation from a sentence or inventing a grammatical explanation.
 */
export const phraseBreakdown=record=>{
  const source=record?.word_breakdown||record?.wordBreakdown||record?.phrase_words||record?.phraseWords||[];
  return(Array.isArray(source)?source:[]).map(item=>({
    text:wordFrom(item),
    meaning:meaningFrom(item),
    note:clean(item&&typeof item==='object'?item.note:''),
    ...(item?.speech_text||item?.speechText?{speech_text:clean(item.speech_text||item.speechText)}:{}),
  })).filter(item=>item.text&&item.meaning);
};

export const phraseUsageNote=record=>clean(
  record?.usage_note||record?.usageNote||record?.grammar_note||record?.grammarNote||record?.context_note||record?.contextNote,
);

export const phraseContextNote=record=>clean(record?.context_note||record?.contextNote);

// Audio examples are deliberately author-supplied.  Do not infer an audio
// filename from a word mentioned in an explanation: that can make a learner
// hear a different sound from the example shown on screen.
export const phraseAudioExamples=record=>{
  const source=record?.audio_examples||record?.audioExamples||[];
  return(Array.isArray(source)?source:[]).map(item=>({
    // A label is optional.  For a one-character sound drill, repeating a
    // generic label above every card adds noise without adding information.
    label:clean(item?.label),
    text:clean(item?.text||item?.target),
    meaning:clean(item?.meaning||item?.translation),
    audio:clean(item?.audio),
    slow_audio:clean(item?.slow_audio||item?.slowAudio),
    audio_source:clean(item?.audio_source||item?.audioSource),
  })).filter(item=>item.text&&item.audio);
};
