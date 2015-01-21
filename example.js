var aPrompt=require('./index.js');

new aPrompt('-> ',function(value){
	console.log('input: %s',value);
});