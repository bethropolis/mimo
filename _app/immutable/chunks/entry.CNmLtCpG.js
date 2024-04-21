import{y as rt}from"./scheduler.Cjus8ci8.js";import{w as pe}from"./index.0H58S7A7.js";new URL("sveltekit-internal://");function at(e,t){return e==="/"||t==="ignore"?e:t==="never"?e.endsWith("/")?e.slice(0,-1):e:t==="always"&&!e.endsWith("/")?e+"/":e}function ot(e){return e.split("%25").map(decodeURI).join("%25")}function st(e){for(const t in e)e[t]=decodeURIComponent(e[t]);return e}function ce({href:e}){return e.split("#")[0]}const it=["href","pathname","search","toString","toJSON"];function ct(e,t,n){const r=new URL(e);Object.defineProperty(r,"searchParams",{value:new Proxy(r.searchParams,{get(a,o){if(o==="get"||o==="getAll"||o==="has")return s=>(n(s),a[o](s));t();const i=Reflect.get(a,o);return typeof i=="function"?i.bind(a):i}}),enumerable:!0,configurable:!0});for(const a of it)Object.defineProperty(r,a,{get(){return t(),e[a]},enumerable:!0,configurable:!0});return r}const lt="/__data.json",ft=".html__data.json";function ut(e){return e.endsWith(".html")?e.replace(/\.html$/,ft):e.replace(/\/$/,"")+lt}function dt(...e){let t=5381;for(const n of e)if(typeof n=="string"){let r=n.length;for(;r;)t=t*33^n.charCodeAt(--r)}else if(ArrayBuffer.isView(n)){const r=new Uint8Array(n.buffer,n.byteOffset,n.byteLength);let a=r.length;for(;a;)t=t*33^r[--a]}else throw new TypeError("value must be a string or TypedArray");return(t>>>0).toString(36)}function ht(e){const t=atob(e),n=new Uint8Array(t.length);for(let r=0;r<t.length;r++)n[r]=t.charCodeAt(r);return n.buffer}const Ne=window.fetch;window.fetch=(e,t)=>((e instanceof Request?e.method:t?.method||"GET")!=="GET"&&F.delete(ge(e)),Ne(e,t));const F=new Map;function pt(e,t){const n=ge(e,t),r=document.querySelector(n);if(r?.textContent){let{body:a,...o}=JSON.parse(r.textContent);const i=r.getAttribute("data-ttl");return i&&F.set(n,{body:a,init:o,ttl:1e3*Number(i)}),r.getAttribute("data-b64")!==null&&(a=ht(a)),Promise.resolve(new Response(a,o))}return window.fetch(e,t)}function gt(e,t,n){if(F.size>0){const r=ge(e,n),a=F.get(r);if(a){if(performance.now()<a.ttl&&["default","force-cache","only-if-cached",void 0].includes(n?.cache))return new Response(a.body,a.init);F.delete(r)}}return window.fetch(t,n)}function ge(e,t){let r=`script[data-sveltekit-fetched][data-url=${JSON.stringify(e instanceof Request?e.url:e)}]`;if(t?.headers||t?.body){const a=[];t.headers&&a.push([...new Headers(t.headers)].join(",")),t.body&&(typeof t.body=="string"||ArrayBuffer.isView(t.body))&&a.push(t.body),r+=`[data-hash="${dt(...a)}"]`}return r}const _t=/^(\[)?(\.\.\.)?(\w+)(?:=(\w+))?(\])?$/;function mt(e){const t=[];return{pattern:e==="/"?/^\/$/:new RegExp(`^${yt(e).map(r=>{const a=/^\[\.\.\.(\w+)(?:=(\w+))?\]$/.exec(r);if(a)return t.push({name:a[1],matcher:a[2],optional:!1,rest:!0,chained:!0}),"(?:/(.*))?";const o=/^\[\[(\w+)(?:=(\w+))?\]\]$/.exec(r);if(o)return t.push({name:o[1],matcher:o[2],optional:!0,rest:!1,chained:!0}),"(?:/([^/]+))?";if(!r)return;const i=r.split(/\[(.+?)\](?!\])/);return"/"+i.map((c,l)=>{if(l%2){if(c.startsWith("x+"))return le(String.fromCharCode(parseInt(c.slice(2),16)));if(c.startsWith("u+"))return le(String.fromCharCode(...c.slice(2).split("-").map(p=>parseInt(p,16))));const d=_t.exec(c),[,g,u,f,h]=d;return t.push({name:f,matcher:h,optional:!!g,rest:!!u,chained:u?l===1&&i[0]==="":!1}),u?"(.*?)":g?"([^/]*)?":"([^/]+?)"}return le(c)}).join("")}).join("")}/?$`),params:t}}function wt(e){return!/^\([^)]+\)$/.test(e)}function yt(e){return e.slice(1).split("/").filter(wt)}function vt(e,t,n){const r={},a=e.slice(1),o=a.filter(s=>s!==void 0);let i=0;for(let s=0;s<t.length;s+=1){const c=t[s];let l=a[s-i];if(c.chained&&c.rest&&i&&(l=a.slice(s-i,s+1).filter(d=>d).join("/"),i=0),l===void 0){c.rest&&(r[c.name]="");continue}if(!c.matcher||n[c.matcher](l)){r[c.name]=l;const d=t[s+1],g=a[s+1];d&&!d.rest&&d.optional&&g&&c.chained&&(i=0),!d&&!g&&Object.keys(r).length===o.length&&(i=0);continue}if(c.optional&&c.chained){i++;continue}return}if(!i)return r}function le(e){return e.normalize().replace(/[[\]]/g,"\\$&").replace(/%/g,"%25").replace(/\//g,"%2[Ff]").replace(/\?/g,"%3[Ff]").replace(/#/g,"%23").replace(/[.*+?^${}()|\\]/g,"\\$&")}function bt({nodes:e,server_loads:t,dictionary:n,matchers:r}){const a=new Set(t);return Object.entries(n).map(([s,[c,l,d]])=>{const{pattern:g,params:u}=mt(s),f={id:s,exec:h=>{const p=g.exec(h);if(p)return vt(p,u,r)},errors:[1,...d||[]].map(h=>e[h]),layouts:[0,...l||[]].map(i),leaf:o(c)};return f.errors.length=f.layouts.length=Math.max(f.errors.length,f.layouts.length),f});function o(s){const c=s<0;return c&&(s=~s),[c,e[s]]}function i(s){return s===void 0?s:[a.has(s),e[s]]}}function Oe(e,t=JSON.parse){try{return t(sessionStorage[e])}catch{}}function Ae(e,t,n=JSON.stringify){const r=n(t);try{sessionStorage[e]=r}catch{}}const R=globalThis.__sveltekit_1j05wwv?.base??"",Et=globalThis.__sveltekit_1j05wwv?.assets??R,kt="1713704123728",je="sveltekit:snapshot",De="sveltekit:scroll",$e="sveltekit:states",St="sveltekit:pageurl",O="sveltekit:history",M="sveltekit:navigation",J={tap:1,hover:2,viewport:3,eager:4,off:-1,false:-1},B=location.origin;function Ce(e){if(e instanceof URL)return e;let t=document.baseURI;if(!t){const n=document.getElementsByTagName("base");t=n.length?n[0].href:document.URL}return new URL(e,t)}function _e(){return{x:pageXOffset,y:pageYOffset}}function x(e,t){return e.getAttribute(`data-sveltekit-${t}`)}const Re={...J,"":J.hover};function Ve(e){let t=e.assignedSlot??e.parentNode;return t?.nodeType===11&&(t=t.host),t}function Fe(e,t){for(;e&&e!==t;){if(e.nodeName.toUpperCase()==="A"&&e.hasAttribute("href"))return e;e=Ve(e)}}function ue(e,t){let n;try{n=new URL(e instanceof SVGAElement?e.href.baseVal:e.href,document.baseURI)}catch{}const r=e instanceof SVGAElement?e.target.baseVal:e.target,a=!n||!!r||ne(n,t)||(e.getAttribute("rel")||"").split(/\s+/).includes("external"),o=n?.origin===B&&e.hasAttribute("download");return{url:n,external:a,target:r,download:o}}function W(e){let t=null,n=null,r=null,a=null,o=null,i=null,s=e;for(;s&&s!==document.documentElement;)r===null&&(r=x(s,"preload-code")),a===null&&(a=x(s,"preload-data")),t===null&&(t=x(s,"keepfocus")),n===null&&(n=x(s,"noscroll")),o===null&&(o=x(s,"reload")),i===null&&(i=x(s,"replacestate")),s=Ve(s);function c(l){switch(l){case"":case"true":return!0;case"off":case"false":return!1;default:return}}return{preload_code:Re[r??"off"],preload_data:Re[a??"off"],keepfocus:c(t),noscroll:c(n),reload:c(o),replace_state:c(i)}}function Ie(e){const t=pe(e);let n=!0;function r(){n=!0,t.update(i=>i)}function a(i){n=!1,t.set(i)}function o(i){let s;return t.subscribe(c=>{(s===void 0||n&&c!==s)&&i(s=c)})}return{notify:r,set:a,subscribe:o}}function At(){const{set:e,subscribe:t}=pe(!1);let n;async function r(){clearTimeout(n);try{const a=await fetch(`${Et}/_app/version.json`,{headers:{pragma:"no-cache","cache-control":"no-cache"}});if(!a.ok)return!1;const i=(await a.json()).version!==kt;return i&&(e(!0),clearTimeout(n)),i}catch{return!1}}return{subscribe:t,check:r}}function ne(e,t){return e.origin!==B||!e.pathname.startsWith(t)}const Rt=-1,It=-2,Lt=-3,Pt=-4,Tt=-5,Ut=-6;function xt(e,t){if(typeof e=="number")return a(e,!0);if(!Array.isArray(e)||e.length===0)throw new Error("Invalid input");const n=e,r=Array(n.length);function a(o,i=!1){if(o===Rt)return;if(o===Lt)return NaN;if(o===Pt)return 1/0;if(o===Tt)return-1/0;if(o===Ut)return-0;if(i)throw new Error("Invalid input");if(o in r)return r[o];const s=n[o];if(!s||typeof s!="object")r[o]=s;else if(Array.isArray(s))if(typeof s[0]=="string"){const c=s[0],l=t?.[c];if(l)return r[o]=l(a(s[1]));switch(c){case"Date":r[o]=new Date(s[1]);break;case"Set":const d=new Set;r[o]=d;for(let f=1;f<s.length;f+=1)d.add(a(s[f]));break;case"Map":const g=new Map;r[o]=g;for(let f=1;f<s.length;f+=2)g.set(a(s[f]),a(s[f+1]));break;case"RegExp":r[o]=new RegExp(s[1],s[2]);break;case"Object":r[o]=Object(s[1]);break;case"BigInt":r[o]=BigInt(s[1]);break;case"null":const u=Object.create(null);r[o]=u;for(let f=1;f<s.length;f+=2)u[s[f]]=a(s[f+1]);break;default:throw new Error(`Unknown type ${c}`)}}else{const c=new Array(s.length);r[o]=c;for(let l=0;l<s.length;l+=1){const d=s[l];d!==It&&(c[l]=a(d))}}else{const c={};r[o]=c;for(const l in s){const d=s[l];c[l]=a(d)}}return r[o]}return a(0)}const Ge=new Set(["load","prerender","csr","ssr","trailingSlash","config"]);[...Ge];const Nt=new Set([...Ge]);[...Nt];function Ot(e){return e.filter(t=>t!=null)}class re{constructor(t,n){this.status=t,typeof n=="string"?this.body={message:n}:n?this.body=n:this.body={message:`Error: ${t}`}}toString(){return JSON.stringify(this.body)}}class Me{constructor(t,n){this.status=t,this.location=n}}class me extends Error{constructor(t,n,r){super(r),this.status=t,this.text=n}}const jt="x-sveltekit-invalidated",Dt="x-sveltekit-trailing-slash";function z(e){return e instanceof re||e instanceof me?e.status:500}function $t(e){return e instanceof me?e.text:"Internal Error"}const U=Oe(De)??{},q=Oe(je)??{},T={url:Ie({}),page:Ie({}),navigating:pe(null),updated:At()};function we(e){U[e]=_e()}function Ct(e,t){let n=e+1;for(;U[n];)delete U[n],n+=1;for(n=t+1;q[n];)delete q[n],n+=1}function D(e){return location.href=e.href,new Promise(()=>{})}function Le(){}let ae,de,X,L,he,$;const qe=[],Z=[];let P=null;const He=[],Vt=[];let N=[],m={branch:[],error:null,url:null},ye=!1,Q=!1,Pe=!0,H=!1,V=!1,Be=!1,ve=!1,be,v,A,S,ee;const G=new Set;async function Xt(e,t,n){document.URL!==location.href&&(location.href=location.href),$=e,ae=bt(e),L=document.documentElement,he=t,de=e.nodes[0],X=e.nodes[1],de(),X(),v=history.state?.[O],A=history.state?.[M],v||(v=A=Date.now(),history.replaceState({...history.state,[O]:v,[M]:A},""));const r=U[v];r&&(history.scrollRestoration="manual",scrollTo(r.x,r.y)),n?await Yt(he,n):Bt(location.href,{replaceState:!0}),Kt()}function Ft(){qe.length=0,ve=!1}function Ke(e){Z.some(t=>t?.snapshot)&&(q[e]=Z.map(t=>t?.snapshot?.capture()))}function Ye(e){q[e]?.forEach((t,n)=>{Z[n]?.snapshot?.restore(t)})}function Te(){we(v),Ae(De,U),Ke(A),Ae(je,q)}async function Je(e,t,n,r){return Y({type:"goto",url:Ce(e),keepfocus:t.keepFocus,noscroll:t.noScroll,replace_state:t.replaceState,state:t.state,redirect_count:n,nav_token:r,accept:()=>{t.invalidateAll&&(ve=!0)}})}async function Gt(e){if(e.id!==P?.id){const t={};G.add(t),P={id:e.id,token:t,promise:ze({...e,preload:t}).then(n=>(G.delete(t),n.type==="loaded"&&n.state.error&&(P=null),n))}}return P.promise}async function fe(e){const t=ae.find(n=>n.exec(Xe(e)));t&&await Promise.all([...t.layouts,t.leaf].map(n=>n?.[1]()))}function We(e,t,n){m=e.state;const r=document.querySelector("style[data-sveltekit]");r&&r.remove(),S=e.props.page,be=new $.root({target:t,props:{...e.props,stores:T,components:Z},hydrate:n}),Ye(A);const a={from:null,to:{params:m.params,route:{id:m.route?.id??null},url:new URL(location.href)},willUnload:!1,type:"enter",complete:Promise.resolve()};N.forEach(o=>o(a)),Q=!0}async function te({url:e,params:t,branch:n,status:r,error:a,route:o,form:i}){let s="never";if(R&&(e.pathname===R||e.pathname===R+"/"))s="always";else for(const f of n)f?.slash!==void 0&&(s=f.slash);e.pathname=at(e.pathname,s),e.search=e.search;const c={type:"loaded",state:{url:e,params:t,branch:n,error:a,route:o},props:{constructors:Ot(n).map(f=>f.node.component),page:S}};i!==void 0&&(c.props.form=i);let l={},d=!S,g=0;for(let f=0;f<Math.max(n.length,m.branch.length);f+=1){const h=n[f],p=m.branch[f];h?.data!==p?.data&&(d=!0),h&&(l={...l,...h.data},d&&(c.props[`data_${g}`]=l),g+=1)}return(!m.url||e.href!==m.url.href||m.error!==a||i!==void 0&&i!==S.form||d)&&(c.props.page={error:a,params:t,route:{id:o?.id??null},state:{},status:r,url:new URL(e),form:i??null,data:d?l:S.data}),c}async function Ee({loader:e,parent:t,url:n,params:r,route:a,server_data_node:o}){let i=null,s=!0;const c={dependencies:new Set,params:new Set,parent:!1,route:!1,url:!1,search_params:new Set},l=await e();if(l.universal?.load){let d=function(...u){for(const f of u){const{href:h}=new URL(f,n);c.dependencies.add(h)}};const g={route:new Proxy(a,{get:(u,f)=>(s&&(c.route=!0),u[f])}),params:new Proxy(r,{get:(u,f)=>(s&&c.params.add(f),u[f])}),data:o?.data??null,url:ct(n,()=>{s&&(c.url=!0)},u=>{s&&c.search_params.add(u)}),async fetch(u,f){let h;u instanceof Request?(h=u.url,f={body:u.method==="GET"||u.method==="HEAD"?void 0:await u.blob(),cache:u.cache,credentials:u.credentials,headers:u.headers,integrity:u.integrity,keepalive:u.keepalive,method:u.method,mode:u.mode,redirect:u.redirect,referrer:u.referrer,referrerPolicy:u.referrerPolicy,signal:u.signal,...f}):h=u;const p=new URL(h,n);return s&&d(p.href),p.origin===n.origin&&(h=p.href.slice(n.origin.length)),Q?gt(h,p.href,f):pt(h,f)},setHeaders:()=>{},depends:d,parent(){return s&&(c.parent=!0),t()},untrack(u){s=!1;try{return u()}finally{s=!0}}};i=await l.universal.load.call(null,g)??null}return{node:l,loader:e,server:o,universal:l.universal?.load?{type:"data",data:i,uses:c}:null,data:i??o?.data??null,slash:l.universal?.trailingSlash??o?.slash}}function Ue(e,t,n,r,a,o){if(ve)return!0;if(!a)return!1;if(a.parent&&e||a.route&&t||a.url&&n)return!0;for(const i of a.search_params)if(r.has(i))return!0;for(const i of a.params)if(o[i]!==m.params[i])return!0;for(const i of a.dependencies)if(qe.some(s=>s(new URL(i))))return!0;return!1}function ke(e,t){return e?.type==="data"?e:e?.type==="skip"?t??null:null}function Mt(e,t){if(!e)return new Set(t.searchParams.keys());const n=new Set([...e.searchParams.keys(),...t.searchParams.keys()]);for(const r of n){const a=e.searchParams.getAll(r),o=t.searchParams.getAll(r);a.every(i=>o.includes(i))&&o.every(i=>a.includes(i))&&n.delete(r)}return n}function xe({error:e,url:t,route:n,params:r}){return{type:"loaded",state:{error:e,url:t,route:n,params:r,branch:[]},props:{page:S,constructors:[]}}}async function ze({id:e,invalidating:t,url:n,params:r,route:a,preload:o}){if(P?.id===e)return G.delete(P.token),P.promise;const{errors:i,layouts:s,leaf:c}=a,l=[...s,c];i.forEach(_=>_?.().catch(()=>{})),l.forEach(_=>_?.[1]().catch(()=>{}));let d=null;const g=m.url?e!==m.url.pathname+m.url.search:!1,u=m.route?a.id!==m.route.id:!1,f=Mt(m.url,n);let h=!1;const p=l.map((_,w)=>{const k=m.branch[w],b=!!_?.[0]&&(k?.loader!==_[1]||Ue(h,u,g,f,k.server?.uses,r));return b&&(h=!0),b});if(p.some(Boolean)){try{d=await et(n,p)}catch(_){const w=await j(_,{url:n,params:r,route:{id:e}});return G.has(o)?xe({error:w,url:n,params:r,route:a}):oe({status:z(_),error:w,url:n,route:a})}if(d.type==="redirect")return d}const I=d?.nodes;let E=!1;const C=l.map(async(_,w)=>{if(!_)return;const k=m.branch[w],b=I?.[w];if((!b||b.type==="skip")&&_[1]===k?.loader&&!Ue(E,u,g,f,k.universal?.uses,r))return k;if(E=!0,b?.type==="error")throw b;return Ee({loader:_[1],url:n,params:r,route:a,parent:async()=>{const se={};for(let ie=0;ie<w;ie+=1)Object.assign(se,(await C[ie])?.data);return se},server_data_node:ke(b===void 0&&_[0]?{type:"skip"}:b??null,_[0]?k?.server:void 0)})});for(const _ of C)_.catch(()=>{});const y=[];for(let _=0;_<l.length;_+=1)if(l[_])try{y.push(await C[_])}catch(w){if(w instanceof Me)return{type:"redirect",location:w.location};if(G.has(o))return xe({error:await j(w,{params:r,url:n,route:{id:a.id}}),url:n,params:r,route:a});let k=z(w),b;if(I?.includes(w))k=w.status??k,b=w.error;else if(w instanceof re)b=w.body;else{if(await T.updated.check())return await D(n);b=await j(w,{params:r,url:n,route:{id:a.id}})}const K=await qt(_,y,i);return K?await te({url:n,params:r,branch:y.slice(0,K.idx).concat(K.node),status:k,error:b,route:a}):await Qe(n,{id:a.id},b,k)}else y.push(void 0);return await te({url:n,params:r,branch:y,status:200,error:null,route:a,form:t?void 0:null})}async function qt(e,t,n){for(;e--;)if(n[e]){let r=e;for(;!t[r];)r-=1;try{return{idx:r+1,node:{node:await n[e](),loader:n[e],data:{},server:null,universal:null}}}catch{continue}}}async function oe({status:e,error:t,url:n,route:r}){const a={};let o=null;if($.server_loads[0]===0)try{const l=await et(n,[!0]);if(l.type!=="data"||l.nodes[0]&&l.nodes[0].type!=="data")throw 0;o=l.nodes[0]??null}catch{(n.origin!==B||n.pathname!==location.pathname||ye)&&await D(n)}const s=await Ee({loader:de,url:n,params:a,route:r,parent:()=>Promise.resolve({}),server_data_node:ke(o)}),c={node:await X(),loader:X,universal:null,server:null,data:null};return await te({url:n,params:a,branch:[s,c],status:e,error:t,route:null})}function Se(e,t){if(!e||ne(e,R))return;let n;try{n=$.hooks.reroute({url:new URL(e)})??e.pathname}catch{return}const r=Xe(n);for(const a of ae){const o=a.exec(r);if(o)return{id:e.pathname+e.search,invalidating:t,route:a,params:st(o),url:e}}}function Xe(e){return ot(e.slice(R.length)||"/")}function Ze({url:e,type:t,intent:n,delta:r}){let a=!1;const o=nt(m,n,e,t);r!==void 0&&(o.navigation.delta=r);const i={...o.navigation,cancel:()=>{a=!0,o.reject(new Error("navigation cancelled"))}};return H||He.forEach(s=>s(i)),a?null:o}async function Y({type:e,url:t,popped:n,keepfocus:r,noscroll:a,replace_state:o,state:i={},redirect_count:s=0,nav_token:c={},accept:l=Le,block:d=Le}){const g=Se(t,!1),u=Ze({url:t,type:e,delta:n?.delta,intent:g});if(!u){d();return}const f=v,h=A;l(),H=!0,Q&&T.navigating.set(u.navigation),ee=c;let p=g&&await ze(g);if(!p){if(ne(t,R))return await D(t);p=await Qe(t,{id:null},await j(new me(404,"Not Found",`Not found: ${t.pathname}`),{url:t,params:{},route:{id:null}}),404)}if(t=g?.url||t,ee!==c)return u.reject(new Error("navigation aborted")),!1;if(p.type==="redirect")if(s>=20)p=await oe({status:500,error:await j(new Error("Redirect loop"),{url:t,params:{},route:{id:null}}),url:t,route:{id:null}});else return Je(new URL(p.location,t).href,{},s+1,c),!1;else p.props.page.status>=400&&await T.updated.check()&&await D(t);if(Ft(),we(f),Ke(h),p.props.page.url.pathname!==t.pathname&&(t.pathname=p.props.page.url.pathname),i=n?n.state:i,!n){const y=o?0:1,_={[O]:v+=y,[M]:A+=y,[$e]:i};(o?history.replaceState:history.pushState).call(history,_,"",t),o||Ct(v,A)}if(P=null,p.props.page.state=i,Q){m=p.state,p.props.page&&(p.props.page.url=t);const y=(await Promise.all(Vt.map(_=>_(u.navigation)))).filter(_=>typeof _=="function");if(y.length>0){let _=function(){N=N.filter(w=>!y.includes(w))};y.push(_),N.push(...y)}be.$set(p.props),Be=!0}else We(p,he,!1);const{activeElement:I}=document;await rt();const E=n?n.scroll:a?_e():null;if(Pe){const y=t.hash&&document.getElementById(decodeURIComponent(t.hash.slice(1)));E?scrollTo(E.x,E.y):y?y.scrollIntoView():scrollTo(0,0)}const C=document.activeElement!==I&&document.activeElement!==document.body;!r&&!C&&Jt(),Pe=!0,p.props.page&&(S=p.props.page),H=!1,e==="popstate"&&Ye(A),u.fulfil(void 0),N.forEach(y=>y(u.navigation)),T.navigating.set(null)}async function Qe(e,t,n,r){return e.origin===B&&e.pathname===location.pathname&&!ye?await oe({status:r,error:n,url:e,route:t}):await D(e)}function Ht(){let e;L.addEventListener("mousemove",o=>{const i=o.target;clearTimeout(e),e=setTimeout(()=>{r(i,2)},20)});function t(o){r(o.composedPath()[0],1)}L.addEventListener("mousedown",t),L.addEventListener("touchstart",t,{passive:!0});const n=new IntersectionObserver(o=>{for(const i of o)i.isIntersecting&&(fe(i.target.href),n.unobserve(i.target))},{threshold:0});function r(o,i){const s=Fe(o,L);if(!s)return;const{url:c,external:l,download:d}=ue(s,R);if(l||d)return;const g=W(s);if(!g.reload)if(i<=g.preload_data){const u=Se(c,!1);u&&Gt(u)}else i<=g.preload_code&&fe(c.pathname)}function a(){n.disconnect();for(const o of L.querySelectorAll("a")){const{url:i,external:s,download:c}=ue(o,R);if(s||c)continue;const l=W(o);l.reload||(l.preload_code===J.viewport&&n.observe(o),l.preload_code===J.eager&&fe(i.pathname))}}N.push(a),a()}function j(e,t){if(e instanceof re)return e.body;const n=z(e),r=$t(e);return $.hooks.handleError({error:e,event:t,status:n,message:r})??{message:r}}function Bt(e,t={}){return e=Ce(e),e.origin!==B?Promise.reject(new Error("goto: invalid URL")):Je(e,t,0)}function Kt(){history.scrollRestoration="manual",addEventListener("beforeunload",t=>{let n=!1;if(Te(),!H){const r=nt(m,void 0,null,"leave"),a={...r.navigation,cancel:()=>{n=!0,r.reject(new Error("navigation cancelled"))}};He.forEach(o=>o(a))}n?(t.preventDefault(),t.returnValue=""):history.scrollRestoration="auto"}),addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&Te()}),navigator.connection?.saveData||Ht(),L.addEventListener("click",t=>{if(t.button||t.which!==1||t.metaKey||t.ctrlKey||t.shiftKey||t.altKey||t.defaultPrevented)return;const n=Fe(t.composedPath()[0],L);if(!n)return;const{url:r,external:a,target:o,download:i}=ue(n,R);if(!r)return;if(o==="_parent"||o==="_top"){if(window.parent!==window)return}else if(o&&o!=="_self")return;const s=W(n);if(!(n instanceof SVGAElement)&&r.protocol!==location.protocol&&!(r.protocol==="https:"||r.protocol==="http:")||i)return;if(a||s.reload){Ze({url:r,type:"link"})?H=!0:t.preventDefault();return}const[l,d]=r.href.split("#");if(d!==void 0&&l===ce(location)){const[,g]=m.url.href.split("#");if(g===d){t.preventDefault(),d===""||d==="top"&&n.ownerDocument.getElementById("top")===null?window.scrollTo({top:0}):n.ownerDocument.getElementById(d)?.scrollIntoView();return}if(V=!0,we(v),e(r),!s.replace_state)return;V=!1}t.preventDefault(),Y({type:"link",url:r,keepfocus:s.keepfocus,noscroll:s.noscroll,replace_state:s.replace_state??r.href===location.href})}),L.addEventListener("submit",t=>{if(t.defaultPrevented)return;const n=HTMLFormElement.prototype.cloneNode.call(t.target),r=t.submitter;if((r?.formMethod||n.method)!=="get")return;const o=new URL(r?.hasAttribute("formaction")&&r?.formAction||n.action);if(ne(o,R))return;const i=t.target,s=W(i);if(s.reload)return;t.preventDefault(),t.stopPropagation();const c=new FormData(i),l=r?.getAttribute("name");l&&c.append(l,r?.getAttribute("value")??""),o.search=new URLSearchParams(c).toString(),Y({type:"form",url:o,keepfocus:s.keepfocus,noscroll:s.noscroll,replace_state:s.replace_state??o.href===location.href})}),addEventListener("popstate",async t=>{if(t.state?.[O]){const n=t.state[O];if(ee={},n===v)return;const r=U[n],a=t.state[$e]??{},o=new URL(t.state[St]??location.href),i=t.state[M],s=ce(location)===ce(m.url);if(i===A&&(Be||s)){e(o),U[v]=_e(),r&&scrollTo(r.x,r.y),a!==S.state&&(S={...S,state:a},be.$set({page:S})),v=n;return}const l=n-v;await Y({type:"popstate",url:o,popped:{state:a,scroll:r,delta:l},accept:()=>{v=n,A=i},block:()=>{history.go(-l)},nav_token:ee})}else if(!V){const n=new URL(location.href);e(n)}}),addEventListener("hashchange",()=>{V&&(V=!1,history.replaceState({...history.state,[O]:++v,[M]:A},"",location.href))});for(const t of document.querySelectorAll("link"))t.rel==="icon"&&(t.href=t.href);addEventListener("pageshow",t=>{t.persisted&&T.navigating.set(null)});function e(t){m.url=t,T.page.set({...S,url:t}),T.page.notify()}}async function Yt(e,{status:t=200,error:n,node_ids:r,params:a,route:o,data:i,form:s}){ye=!0;const c=new URL(location.href);({params:a={},route:o={id:null}}=Se(c,!1)||{});let l;try{const d=r.map(async(f,h)=>{const p=i[h];return p?.uses&&(p.uses=tt(p.uses)),Ee({loader:$.nodes[f],url:c,params:a,route:o,parent:async()=>{const I={};for(let E=0;E<h;E+=1)Object.assign(I,(await d[E]).data);return I},server_data_node:ke(p)})}),g=await Promise.all(d),u=ae.find(({id:f})=>f===o.id);if(u){const f=u.layouts;for(let h=0;h<f.length;h++)f[h]||g.splice(h,0,void 0)}l=await te({url:c,params:a,branch:g,status:t,error:n,form:s,route:u??null})}catch(d){if(d instanceof Me){await D(new URL(d.location,location.href));return}l=await oe({status:z(d),error:await j(d,{url:c,params:a,route:o}),url:c,route:o})}l.props.page&&(l.props.page.state={}),We(l,e,!0)}async function et(e,t){const n=new URL(e);n.pathname=ut(e.pathname),e.pathname.endsWith("/")&&n.searchParams.append(Dt,"1"),n.searchParams.append(jt,t.map(a=>a?"1":"0").join(""));const r=await Ne(n.href);if(!r.ok){let a;throw r.headers.get("content-type")?.includes("application/json")?a=await r.json():r.status===404?a="Not Found":r.status===500&&(a="Internal Error"),new re(r.status,a)}return new Promise(async a=>{const o=new Map,i=r.body.getReader(),s=new TextDecoder;function c(d){return xt(d,{Promise:g=>new Promise((u,f)=>{o.set(g,{fulfil:u,reject:f})})})}let l="";for(;;){const{done:d,value:g}=await i.read();if(d&&!l)break;for(l+=!g&&l?`
`:s.decode(g,{stream:!0});;){const u=l.indexOf(`
`);if(u===-1)break;const f=JSON.parse(l.slice(0,u));if(l=l.slice(u+1),f.type==="redirect")return a(f);if(f.type==="data")f.nodes?.forEach(h=>{h?.type==="data"&&(h.uses=tt(h.uses),h.data=c(h.data))}),a(f);else if(f.type==="chunk"){const{id:h,data:p,error:I}=f,E=o.get(h);o.delete(h),I?E.reject(c(I)):E.fulfil(c(p))}}}})}function tt(e){return{dependencies:new Set(e?.dependencies??[]),params:new Set(e?.params??[]),parent:!!e?.parent,route:!!e?.route,url:!!e?.url,search_params:new Set(e?.search_params??[])}}function Jt(){const e=document.querySelector("[autofocus]");if(e)e.focus();else{const t=document.body,n=t.getAttribute("tabindex");t.tabIndex=-1,t.focus({preventScroll:!0,focusVisible:!1}),n!==null?t.setAttribute("tabindex",n):t.removeAttribute("tabindex");const r=getSelection();if(r&&r.type!=="None"){const a=[];for(let o=0;o<r.rangeCount;o+=1)a.push(r.getRangeAt(o));setTimeout(()=>{if(r.rangeCount===a.length){for(let o=0;o<r.rangeCount;o+=1){const i=a[o],s=r.getRangeAt(o);if(i.commonAncestorContainer!==s.commonAncestorContainer||i.startContainer!==s.startContainer||i.endContainer!==s.endContainer||i.startOffset!==s.startOffset||i.endOffset!==s.endOffset)return}r.removeAllRanges()}})}}}function nt(e,t,n,r){let a,o;const i=new Promise((c,l)=>{a=c,o=l});return i.catch(()=>{}),{navigation:{from:{params:e.params,route:{id:e.route?.id??null},url:e.url},to:n&&{params:t?.params??null,route:{id:t?.route?.id??null},url:n},willUnload:!t,type:r,complete:i},fulfil:a,reject:o}}export{Xt as a,T as s};
