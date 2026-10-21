/* Clean URLs (fwg.global/malaysia/security) on top of the in-page router.
 * Each route also exists as a static file (malaysia/security/index.html) with its own title and description. */
(function(){
  var M=window.FWG_META||{},P2={},G2={};for(var k in M){G2[k]=M[k].p;P2[M[k].p]=k}
  function pageOf(id){var el=document.getElementById(id);var h=el&&el.closest&&el.closest('section.page');return h?h.getAttribute('data-page'):null}
  window.FWG_ROUTE=function(){var h=location.hash.slice(1);if(h)return h;var p=location.pathname.replace(/index\.html$/,'').replace(/\/$/,'')||'/';return P2[p]||'home'};
  document.addEventListener('click',function(e){if(e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    var a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a)return;var id=a.getAttribute('href').slice(1);if(!id)return;
    var url;if(G2[id])url=G2[id];else{var pg=pageOf(id);if(!pg)return;url=(G2[pg]==='/'?'/':G2[pg])+'#'+id}
    e.preventDefault();history.pushState(null,'',url);window.dispatchEvent(new HashChangeEvent('hashchange'))},true);
  window.addEventListener('popstate',function(){window.dispatchEvent(new HashChangeEvent('hashchange'))});
  var h=location.hash.slice(1);if(h&&G2[h])history.replaceState(null,'',G2[h]);
})();
