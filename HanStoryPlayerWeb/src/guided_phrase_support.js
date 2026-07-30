const clean=value=>String(value??'').trim();

const wordFrom=item=>clean(typeof item==='string'?item:item?.text||item?.word||item?.target||item?.form);
const meaningFrom=item=>clean(typeof item==='object'&&(item?.meaning||item?.translation||item?.gloss||item?.label));

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
    note:clean(typeof item==='object'&&item?.note),
  })).filter(item=>item.text&&item.meaning);
};

export const phraseUsageNote=record=>clean(
  record?.usage_note||record?.usageNote||record?.grammar_note||record?.grammarNote||record?.context_note||record?.contextNote,
);

export const phraseContextNote=record=>clean(record?.context_note||record?.contextNote);
