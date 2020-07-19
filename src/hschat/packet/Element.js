const escapeXMLTable={
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&apos;'
}
class Element{
  constructor(name,attrs){
    this.name=name
    this.parent=null
    this.children=[]
    this.attrs={}
    this.opened=false;
    this.ended=false;
    this.setAttrs(attrs)
  }
  setAttrs(attrs){
    if(attrs){
      for(let [key,value] of Object.entries(attrs)){
        this.attrs[key]=value;
      }
    }
  }
  c(name,attrs){
    return this.cnode(new Element(name,attrs))
  }
  cnode(child){
    this.children.push(child)
    if(typeof child==='object'){
      child.parent=this
    }
    return child
  }
  t(text){
    if(text){
      this.children.push(text)
    }
    return this;
  }
  toString(end){
    let s='';
    s=this.elementToString(this,s,end);
    return s;
  }
  elementToString(el,s,end){
    if(el&&el.constructor.name==='Element'){
      s+='<';
      s+=el.name;
      for(let k in el.attrs){
        let v=el.attrs[k]
        if(v!=null){
          s+=' ';
          s+=k;
          s+='="';
          if(typeof v!=='string'){
            v=v.toString()
          }
          s+=escapeXML(v);
          s+='"'
        }
      }
      if(el.children.length===0){
        if(end){
          s+='/>';
          el.opened=true;
          el.ended=true;
        }else{
          s+='>';
          el.opened=true;
        }
      }else{
        s+='>';
        el.opened=true;
        for(let i=0;i<el.children.length;i++){
          let child=el.children[i];
          s=el.elementToString(child,s,true);
        }
        if(end){
          s+='</';
          s+=el.name;
          s+='>'
          el.ended=true;
        }
      }
    }else if(typeof el==='string'){
      s+=escapeXMLText(el);
    }
    return s;
  }
}

function escapeXMLReplace (match) {
  return escapeXMLTable[match]
}
function escapeXML(s){
  return s.replace(/&|<|>|"|'/g, escapeXMLReplace)
}
function escapeXMLText(s){
  return s.replace(/&|<|>/g, escapeXMLReplace)
}
module.exports=Element;
