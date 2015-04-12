var aPrompt=require('./index.js');

ex1();

function ex1(){
	new aPrompt('-> ',function(value){
		console.log('input: %s',value);
		ex2();
	});
}
function ex2(){
	new aPrompt(
		'-> ',
		{'cleanPromptLine':true},
		function(value){
			console.log('input: %s',value);
		}
);
}


