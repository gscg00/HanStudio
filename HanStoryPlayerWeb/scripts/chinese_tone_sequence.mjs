const teaching=activity=>activity?.gradable===false||['lesson_intro','teach_concept','teach_word','teach_pattern'].includes(activity?.type);

// Tonal discrimination is meaningful only after every contour named in the
// choices has been introduced.  Keep the opening first, then teach the four
// contours, and finally ask the listening questions.
export const sequenceChineseToneLesson=lesson=>{
  if(lesson?.id!=='chinese-reading-00-02')return lesson;
  const activities=lesson.activities||[];
  const intro=activities.filter(activity=>activity.type==='lesson_intro');
  const cards=activities.filter(activity=>activity.type!=='lesson_intro'&&teaching(activity));
  const practice=activities.filter(activity=>!teaching(activity));
  const ordered=[...intro,...cards,...practice];
  if(ordered.every((activity,index)=>activity===activities[index]))return lesson;
  return {...lesson,activities:ordered};
};
