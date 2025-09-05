# Code Citations

## License: unknown
<https://github.com/JasonGardner-code/BrowserExperiments/blob/70991710969fdce01002a47083bb578d60b21966/Sand.html>

```
) {
          try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
```
