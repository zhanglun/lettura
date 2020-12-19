console.log('from worker');

postMessage("I'm working before postMessage('ali').", '*');

onmessage = (oEvent) => {
  postMessage(`Hi ${oEvent.data}`, '*');
};
