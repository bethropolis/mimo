import{r as $,n as _,z as y,d as S,g as E,A as b,i as w,B as C,C as x,D as I,E as B,F as p,G as O,H as j,I as z,J as A,K as D}from"./scheduler.Cjus8ci8.js";const o=new Set;let d;function M(){d={r:0,c:[],p:d}}function N(){d.r||$(d.c),d=d.p}function F(t,e){t&&t.i&&(o.delete(t),t.i(e))}function P(t,e,n,s){if(t&&t.o){if(o.has(t))return;o.add(t),d.c.push(()=>{o.delete(t),s&&(n&&t.d(1),s())}),t.o(e)}else s&&s()}function R(t,e,n){const s=t.$$.props[e];s!==void 0&&(t.$$.bound[s]=n,n(t.$$.ctx[s]))}function U(t){t&&t.c()}function V(t,e){t&&t.l(e)}function G(t,e,n){const{fragment:s,after_update:i}=t.$$;s&&s.m(e,n),x(()=>{const f=t.$$.on_mount.map(O).filter(w);t.$$.on_destroy?t.$$.on_destroy.push(...f):$(f),t.$$.on_mount=[]}),i.forEach(x)}function H(t,e){const n=t.$$;n.fragment!==null&&(I(n.after_update),$(n.on_destroy),n.fragment&&n.fragment.d(e),n.on_destroy=n.fragment=null,n.ctx=[])}function J(t,e){t.$$.dirty[0]===-1&&(j.push(t),z(),t.$$.dirty.fill(0)),t.$$.dirty[e/31|0]|=1<<e%31}function Q(t,e,n,s,i,f,c=null,v=[-1]){const u=B;p(t);const r=t.$$={fragment:null,ctx:[],props:f,update:_,not_equal:i,bound:y(),on_mount:[],on_destroy:[],on_disconnect:[],before_update:[],after_update:[],context:new Map(e.context||(u?u.$$.context:[])),callbacks:y(),dirty:v,skip_bound:!1,root:e.target||u.$$.root};c&&c(r.root);let h=!1;if(r.ctx=n?n(t,e.props||{},(a,l,...g)=>{const m=g.length?g[0]:l;return r.ctx&&i(r.ctx[a],r.ctx[a]=m)&&(!r.skip_bound&&r.bound[a]&&r.bound[a](m),h&&J(t,a)),l}):[],r.update(),h=!0,$(r.before_update),r.fragment=s?s(r.ctx):!1,e.target){if(e.hydrate){A();const a=S(e.target);r.fragment&&r.fragment.l(a),a.forEach(E)}else r.fragment&&r.fragment.c();e.intro&&F(t.$$.fragment),G(t,e.target,e.anchor),D(),b()}p(u)}class T{$$=void 0;$$set=void 0;$destroy(){H(this,1),this.$destroy=_}$on(e,n){if(!w(n))return _;const s=this.$$.callbacks[e]||(this.$$.callbacks[e]=[]);return s.push(n),()=>{const i=s.indexOf(n);i!==-1&&s.splice(i,1)}}$set(e){this.$$set&&!C(e)&&(this.$$.skip_bound=!0,this.$$set(e),this.$$.skip_bound=!1)}}const K="4";typeof window<"u"&&(window.__svelte||(window.__svelte={v:new Set})).v.add(K);export{T as S,F as a,U as b,N as c,V as d,H as e,R as f,M as g,Q as i,G as m,P as t};
