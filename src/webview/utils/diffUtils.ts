import { diffLines, diffWordsWithSpace } from 'diff';

export function calculateFileDiff(original: string, proposed: string) {
  return diffLines(original, proposed);
}

export function formatDiffForDisplay(diff: any[]) {
  // Format diff for Monaco Editor or custom diff viewer
  let output = '';
  
  diff.forEach(part => {
    if (part.added) {
      output += `+ ${part.value}`;
    } else if (part.removed) {
      output += `- ${part.value}`;
    } else {
      output += `  ${part.value}`;
    }
  });
  
  return output;
}