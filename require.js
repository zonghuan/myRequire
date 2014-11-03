var require,define;
(function(w){
	var doc=w.document;
	var plainObj={};
	var hasOwn=plainObj.hasOwnProperty;
	var isArray=function(ar){return plainObj.toString.call(ar)=='[object Array]';};
	var isString=function(str){return typeof(str)=='string';};
	var isObj=function(obj){return typeof(obj)=='object'&&!isArray(obj);};
	var isNumber=function(num){return typeof(num)=='number';};
	var isFunc=function(fn){return typeof(fn)=='function';};
	var extend=function(p,c){
		if(!isObj(p)) return p;
		if(isObj(c))
			for(var i in c)if(hasOwn.call(c,i)){p[i]=c[i];}
		if(isArray(c))
			for(var i=0;i<c.length;i++)p[i]=c[i];
		return p;
	};
	var getCurrentScript=function(){
		if(document.currentScript!=undefined) return document.currentScript;
		else{
			var head=doc.getElementsByTagName('head')[0];
			var scripts=head.getElementsByTagName('script');
			for(var i=scripts.length-1;i>=0;i--){
				if(scripts[i]&&scripts[i].readyState=='interactive') return scripts[i];
			}
			return document.createElement('script');
		}
	};
	var each=function(param,callback){
		if(isObj(param)){
			for(var i in param) if(hasOwn.call(param,i))
				callback.apply(param,[i,param[i]]);
		} else if(isArray(param)){
			for(var i=0;i<param.length;i++)
				callback.apply(param,[i,param[i]]);
		}
	};
	var loadScript=function(url,id,callback){
		var head=doc.getElementsByTagName('head')[0];
		var srp=doc.createElement('script');
		srp.src=url;
		srp.async='true';
		srp.type='text/javascript';
		callback=isFunc(callback)?callback:function(){};
		srp.onload=srp.onreadystatechange=function(){
			if(!this.reayState||this.reayState=='loaded'||this.readyState=='complete'){
				callback(this);
				this.onload=this.onreadystatechange=null;
			}
		};
		srp.setAttribute('modeId',id);
		head.appendChild(srp);
	};
	var publish={
		on:function(type,callback){
			if(typeof(type)=='function'){
				callback=type;
				type='any';
			}
			if(!(type in this)){this[type]=[];}
			this[type].push(callback);
		},
		fire:function(type,msg){
			if(!(type in this))return;
			for(var i=0;i<this[type].length;i++){
				this[type][i](msg);
			}
		}
	};
	var Mode=function(id,url){
		if(id in Mode.store) return Mode.store[id];
		else Mode.store[id]=this;
		this.complete=false;
		this.url=url;
		this.id=id;
		this.callback=function(){};
		this.deps=[];
		this.module=null;
		return extend(this,publish).init();	
	};
	Mode.store={};
	Mode.prototype.init=function(){
		loadScript(this.url,this.id,function(){});
		return this;
	};
	Mode.prototype.setCall=function(callback){
		if(isFunc(callback)) this.callback=callback;
		return this;
	};
	Mode.prototype.require=function(deps){
		var self=this;
		each(deps,function(i,dep){
			self.deps.push(dep);
			dep.on('ready',function(){
				self.check();
			});
		});
		self.check();
	};
	Mode.prototype.check=function(){
		var deps=this.deps;
		var flag=true;
		each(deps,function(i,dep){
			if(!dep.complete) flag=false;
		});
		if(flag==true){
			this.complete=true;
			var modules=[];
			for(var i=0;i<deps.length;i++)
				modules.push(deps[i].module);
			this.module=this.callback.apply(window,modules);
			this.fire('ready');
		}
	};
	var Context={
		path:{},
		getPathId:function(path){
			var id=path;
			each(this.path,function(i,value){
				if(value==path) id=i;
			});
			return id;
		},
		getPath:function(id){
			if(id in this.path) return path[i];
			else return id;
		},
		config:function(config){
			if('path' in config){this.path=extend(this.path,config['path']);}
			return this;
		},
		define:function(id,deps,callback){
			var script=getCurrentScript();
			var modeId=script.getAttribute('modeId');
			var nowMode=new Mode(modeId,Context.getPath(modeId)).setCall(callback);
			var depsMode=[];
			for(var i=0;i<deps.length;i++){
				depsMode.push(new Mode(deps[i],Context.getPath(deps[i])));
			}
			nowMode.require(depsMode);
		},
		require:function(deps,callback){
			var self=this;
			var depsMode=[];
			var check=function(){
				for(var i=0;i<depsMode.length;i++){
					if(!depsMode[i].complete) return false;
				}
				return true;
			};
			for(var i=0;i<deps.length;i++){
				var mode=new Mode(deps[i],self.getPath(deps[i]));
				depsMode.push(mode);
				mode.on('ready',function(){
					if(check()) {
						var modules=[];
						for(var i=0;i<depsMode.length;i++)
							modules.push(depsMode[i].module);
						callback.apply(window,modules);
					}
				});
			}
		}
	};
	define=function(){
		var id,deps=[],callback,argus=arguments;
		for(var i=0;i<argus.length;i++){
			if(isString(argus[i])) id=argus[i];
			if(isArray(argus[i])) deps=argus[i];
			if(isFunc(argus[i])) callback=argus[i];
		}
		Context.define(id,deps,callback);
	};
	require=function(){
		var argus=arguments,deps=[],callback;
		for(var i=0;i<argus.length;i++){
			if(isArray(argus[i])) deps=argus[i];
			if(isFunc(argus[i])) callback=argus[i];
		}
		Context.require(deps,callback);
	};
	require.config=function(param){Context.config(param);};
})(window);
