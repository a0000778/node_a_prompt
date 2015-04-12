var stdin=process.stdin;
var stdout=process.stdout;
const lengthTable=[
	{'start': 0x0000,'end': 0x001F,'length': 0},
	{'start': 0x007F,'end': 0x007F,'length': 0},
	{'start': 0x2E80,'end': 0x4DB5,'length': 2},
	{'start': 0x4E00,'end': 0x9FCC,'length': 2},
	{'start': 0xA000,'end': 0xA4C6,'length': 2},
	{'start': 0xAC00,'end': 0xD7A4,'length': 2},
	{'start': 0xF900,'end': 0xFA6D,'length': 2}
];

function getLength(charCode){
	var findAt=0;
	while(findAt<lengthTable.length){
		if(charCode>=lengthTable[findAt].start && charCode<=lengthTable[findAt].end)
			break;
		findAt++;
	}
	return findAt<lengthTable.length? lengthTable[findAt].length:1;
}
function getTotalLength(str){
	var total=0;
	var countAt=0;
	var strLen=str.length;
	while(countAt<strLen){
		total+=getLength(str.charCodeAt(countAt++));
	}
	return total;
}

function aPrompt(notice,option,callback){
	var _=this;
	if(!callback){
		callback=option;
		option={};
	}
	
	this.beforeRaw=stdin.isRaw;
	this.callback=callback;
	this.cleanPromptLine=!!option.cleanPromptLine;
	this.input='';
	this.notice=new Buffer(notice,'utf8');
	this.noticeLen=getTotalLength(notice);
	this.position=0;
	this.updateEv=function(data){
		_.update(data);
	}
	
	this.beforeRaw || stdin.setRawMode(true);
	stdout.write(this.notice);
	stdin.on('data',this.updateEv);
	stdin.resume();
}
aPrompt.prototype.update=function(data){
	//清空目前輸出
	var clearToHead=0;
	var clearCount=0;
	var clearCharLength=getTotalLength(this.input.substr(0,this.position));
	clearToHead+=this.noticeLen+clearCharLength;
	clearCount+=this.noticeLen+clearCharLength;
	clearCount+=getTotalLength(this.input.substr(this.position));
	var clearChars=new Buffer(clearCount*2+clearToHead);
	clearChars.fill(0x08,0,clearToHead);
	clearChars.fill(0x20,clearToHead,clearToHead+clearCount);
	clearChars.fill(0x08,clearToHead+clearCount);

	data=data.toString('utf8');
	var procCharCode,rmLength,procAt=0;
	while(procAt<data.length){
		procCharCode=data.charCodeAt(procAt);
		switch(procCharCode){
			case 0x0D://輸入完畢
				if(this.cleanPromptLine)
					stdout.write(clearChars);
				this.end();
				return;
			break;
			case 0x7F://刪除字元
				this.input=this.input.substr(0,this.position-1)+this.input.substr(this.position);
				this.position--;
			break;
			case 0x1B:
				if(data.charCodeAt(procAt+1)===0x5B){
					switch(data.charCodeAt(procAt+2)){
						case 0x44://左
							if(this.position>0)
								this.position--;
							else
								stdout.write(new Buffer([0x07]));
						break;
						case 0x43://右
							if(this.position<this.input.length)
								this.position++;
							else
								stdout.write(new Buffer([0x07]));
						break;
						case 0x48://最前
							this.position=0
						break;
						case 0x46://最後
							this.position=input.length;
						break;
					}
					procAt+=2;
					break;
				}
			default:
				this.input=this.input.substr(0,this.position)+data.charAt(procAt)+this.input.substr(this.position);
				this.position++;
		}
		procAt++;
	}

	//填入目前輸出
	stdout.write(clearChars);
	stdout.write(this.notice);
	stdout.write(this.input);

	//游標歸位
	var nowPosition=this.input.length;
	if(nowPosition!==this.position){
		var countBack=0;
		while(nowPosition!==this.position){
			nowPosition--;
			countBack+=getLength(this.input.charCodeAt(nowPosition));
		}
		var backChars=new Buffer(countBack);
		backChars.fill(0x08);
		stdout.write(backChars);
	}
}
aPrompt.prototype.end=function(){
	stdin.pause();
	stdin.removeListener('data',this.updateEv);
	stdin.setRawMode(this.beforeRaw);
	if(!this.cleanPromptLine)
		stdout.write(new Buffer([0x0D,0x0A]));
	this.callback(this.input);
}

module.exports=aPrompt;