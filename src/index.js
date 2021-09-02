import cssStr from 'css-str:./style.css';
import workletStr from 'iife-str:./worklet.js';

if (self.CSS && CSS.paintWorklet) {
  const style = document.createElement('style');
  style.textContent = cssStr;
  document.head.append(style);

  const workletBlob = new Blob([workletStr], { type: 'text/javascript' });
  const workletUrl = URL.createObjectURL(workletBlob);
  CSS.paintWorklet.addModule(workletUrl);
}
