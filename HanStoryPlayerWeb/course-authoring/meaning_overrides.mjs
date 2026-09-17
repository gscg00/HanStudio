// Estas formas distinguen la edad relativa; no equivalen a hermano/a sin más.
export const MEANING_OVERRIDES={
  German:{'Wie heißen Sie?':'¿Cómo se llama?'},
  French:{'Comment vous appelez-vous ?':'¿Cómo se llama?'},
  Portuguese:{'Como se chama?':'¿Cómo se llama?'},
  Russian:{'Как вас зовут?':'¿Cómo se llama?','Меня зовут Анна.':'Me llamo Anna.'},
  Japanese:{'妹':'hermana menor','弟':'hermano menor','彼女は私の妹です。':'Ella es mi hermana menor.','弟が二人います。':'Tengo dos hermanos menores.'},
  Korean:{'여동생':'hermana menor','남동생':'hermano menor','그녀는 제 여동생이에요.':'Ella es mi hermana menor.','저는 남동생이 두 명 있어요.':'Tengo dos hermanos menores.','이 사람들은 제 가족이에요.':'Estas personas son mi familia.'},
  Chinese:{'妹妹':'hermana menor','弟弟':'hermano menor','她是我妹妹。':'Ella es mi hermana menor.','我有两个弟弟。':'Tengo dos hermanos menores.'}
};
export const meaningForTarget=(language,target,meaning)=>MEANING_OVERRIDES[language]?.[target]||meaning;
