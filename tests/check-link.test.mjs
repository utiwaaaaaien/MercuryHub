import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkLink } from '../lib/check-link.ts';
const target = { id: 'fixture', url: 'https://example.org/catalog' };
const fake = (body, status = 200, headers = {}) => async () => new Response(body, { status, headers });
test('successful response keeps the full path', async () => {
  let address;
  const result = await checkLink(target, { fetcher: async url => { address = url; return new Response('<title>Movies</title>'); } });
  assert.equal(address, target.url); assert.equal(result.state, 'reachable'); assert.equal(result.statusCode, 200);
});
test('denials and rate limits are not offline', async () => {
  for (const status of [401,403,429,451]) assert.equal((await checkLink(target,{fetcher:fake('',status)})).state,'restricted');
});
test('missing entry and server failure are distinguished', async () => {
  assert.match((await checkLink(target,{fetcher:fake('',404)})).reason,/入口页面不存在/);
  assert.equal((await checkLink(target,{fetcher:fake('',503)})).state,'error');
});
test('200 challenge, login and parked domains are not marked successful', async () => {
  for (const title of ['Just a moment...', '用户登录']) assert.equal((await checkLink(target,{fetcher:fake(`<title>${title}</title>`)})).state,'restricted');
  assert.equal((await checkLink(target,{fetcher:fake('<title>Domain for sale</title>')})).state,'review');
});
test('safe relative redirect follows path', async () => {
  const urls=[]; const result=await checkLink(target,{fetcher:async url=>{urls.push(url);return urls.length===1 ? new Response('',{status:302,headers:{location:'/new'}}):new Response('<title>Catalog</title>');}});
  assert.equal(result.state,'reachable');assert.deepEqual(urls,[target.url,'https://example.org/new']);
});
test('unsafe redirect never performs a second request', async () => {
  for (const location of ['http://127.0.0.1/','http://169.254.169.254/','https://evil.test/','https://example.org:8080/','https://user:pass@example.org/','http://example.org/','javascript:alert(1)']) {
    let calls=0; const result=await checkLink(target,{fetcher:async()=>{calls++;return new Response('',{status:302,headers:{location}})}});
    assert.equal(calls,1);assert.equal(result.state,'review');
  }
});
test('redirect loops and empty content require review', async()=>{
  assert.equal((await checkLink(target,{fetcher:fake('',302,{location:'/loop'})})).state,'review');
  assert.equal((await checkLink(target,{fetcher:fake(null,204)})).state,'review');
});
test('timeout is bounded and network failure does not claim permanent closure', async()=>{
  const result=await checkLink(target,{timeoutMs:15,fetcher:async(_url,{signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(new Error('abort'))))});
  assert.equal(result.state,'failed');assert.match(result.reason,/本次请求超时/);
  assert.equal((await checkLink(target,{fetcher:async()=>{throw new Error('TLS certificate error')}})).state,'failed');
});
test('large body stops after sample without buffering whole response',async()=>{
  let cancelled=false;
  const result=await checkLink(target,{fetcher:async()=>new Response(new ReadableStream({pull(c){c.enqueue(new TextEncoder().encode('<title>Movies</title>'+'a'.repeat(65536)));},cancel(){cancelled=true;}}))});
  assert.equal(result.state,'reachable');assert.equal(cancelled,true);
});
