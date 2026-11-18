const $=s=>document.querySelector(s), esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plain=html=>{const d=new DOMParser().parseFromString(html||'','text/html');return d.body.textContent||''};
const cache=new Map();let request=0,episodes=[];
async function api(path){if(cache.has(path))return cache.get(path);const r=await fetch('https://api.tvmaze.com'+path,{signal:AbortSignal.timeout(18000)});if(!r.ok)throw Error(r.status===429?'TVmaze is busy. Please try again in a moment.':'Could not load TVmaze data. Please try again.');const data=await r.json();cache.set(path,data);return data}
function cards(shows){$('#shows').innerHTML=shows.map(s=>`<button class="show" data-id="${s.id}" aria-label="Explore episodes of ${esc(s.name)}"><div class="poster">${s.image?`<img src="${esc(s.image.medium)}" alt="${esc(s.name)} poster" loading="lazy">`:'No poster available'}${s.rating?.average?`<span class="rating">★ ${s.rating.average}</span>`:''}</div><h3>${esc(s.name)}</h3><div class="meta">${esc(s.premiered?.slice(0,4)||'Year unknown')} · ${esc(s.genres?.[0]||s.type||'TV series')}</div></button>`).join('');$('#shows').querySelectorAll('button').forEach((b,i)=>b.onclick=()=>openShow(shows[i]));}
async function search(q){q=q.trim();if(!q)return;const token=++request;$('#detail').hidden=true;$('#browse').hidden=false;$('#shows').innerHTML='';$('#results-title').textContent=`Results for “${q}”`;$('#result-count').textContent='';$('#status').textContent='Searching TVmaze…';try{const result=await api('/search/shows?q='+encodeURIComponent(q));if(token!==request)return;cards(result.map(x=>x.show));$('#result-count').textContent=`${result.length} SHOW${result.length===1?'':'S'}`;$('#status').textContent=result.length?'':'No shows found. Try a different title or spelling.'}catch(e){if(token===request)$('#status').textContent=e.message}}
$('#search').onsubmit=e=>{e.preventDefault();search($('#query').value)};document.querySelectorAll('[data-query]').forEach(b=>b.onclick=()=>{$('#query').value=b.dataset.query;search(b.dataset.query)});
async function openShow(s){const token=++request;$('#browse').hidden=true;$('#detail').hidden=false;$('#detail').innerHTML=`<button class="back">← Back to shows</button><div class="show-info">${s.image?`<img src="${esc(s.image.medium)}" alt="${esc(s.name)} poster">`:''}<div><h2>${esc(s.name)}</h2><div class="meta">${esc(s.genres.join(' · '))} · ${esc(s.status)} · ${esc(s.network?.name||s.webChannel?.name||s.language||'')}</div><p>${esc(plain(s.summary))}</p><a href="${esc(s.url)}" target="_blank" rel="noopener">View on TVmaze ↗</a></div></div><div id="episode-content" role="status">Loading episodes…</div>`;$('.back').onclick=()=>{request++;$('#detail').hidden=true;$('#browse').hidden=false};$('#detail').scrollIntoView({behavior:'smooth',block:'start'});try{const loaded=await api(`/shows/${s.id}/episodes?specials=1`);if(token!==request)return;episodes=loaded;const seasons=[...new Set(episodes.map(e=>e.season))].sort((a,b)=>a-b);$('#episode-content').removeAttribute('role');$('#episode-content').innerHTML=`<div class="filters"><label class="sr" for="episode-query">Search episode titles or episode numbers</label><input id="episode-query" placeholder="Search episode title or S01E01…"><label class="sr" for="season">Season</label><select id="season"><option value="all">All seasons</option>${seasons.map(s=>`<option value="${s}">Season ${s}</option>`).join('')}</select><label><input type="checkbox" id="specials" checked> Include specials</label></div><div class="watch-progress"><div id="watch-progress" class="meta" role="status"></div><button type="button" class="watch-button" id="next-unwatched">Next unwatched ↗</button></div><p class="meta" id="ep-count" role="status"></p><div class="episodes"></div>`;$('#episode-query').oninput=renderEpisodes;$('#season').onchange=renderEpisodes;$('#specials').onchange=renderEpisodes;$('#next-unwatched').onclick=jumpToNextUnwatched;renderEpisodes()}catch(e){if(token===request){$('#episode-content').textContent=e.message;const retry=document.createElement('button');retry.textContent='Retry';retry.className='back';retry.onclick=()=>openShow(s);$('#episode-content').append(' ',retry)}}}
function code(e){return `S${String(e.season).padStart(2,'0')}${e.number==null?' · Special':'E'+String(e.number).padStart(2,'0')}`}
const watchStorageKey = 'episode.watchedIds';
const watched = loadWatched();

function loadWatched() {
  try {
    const ids = JSON.parse(localStorage.getItem(watchStorageKey));
    return new Set(Array.isArray(ids) ? ids.filter(Number.isInteger) : []);
  } catch {
    return new Set();
  }
}

function includedEpisodes() {
  return $('#specials').checked ? episodes : episodes.filter(e => e.number != null);
}

function nextUnwatched() {
  return includedEpisodes().find(e => !watched.has(e.id));
}

function updateProgress() {
  const season = $('#season').value;
  const list = includedEpisodes().filter(e => season === 'all' || e.season === Number(season));
  const count = list.filter(e => watched.has(e.id)).length;
  const label = season === 'all' ? 'All seasons' : `Season ${season}`;
  $('#watch-progress').textContent = `${label} · ${count} of ${list.length} watched`;
  $('#next-unwatched').disabled = !nextUnwatched();
}

function jumpToNextUnwatched() {
  const episode = nextUnwatched();
  if (!episode) return;
  $('#episode-query').value = '';
  if ($('#season').value !== 'all') $('#season').value = episode.season;
  renderEpisodes();
  const row = $(`#episode-${episode.id}`);
  row.open = true;
  row.scrollIntoView({block: 'center'});
  row.querySelector('.watch-button').focus({preventScroll: true});
}

function updateWatchButton(button, id) {
  button.textContent = watched.has(id) ? 'Mark unwatched' : 'Mark watched';
  button.closest('.episode-row').classList.toggle('is-watched', watched.has(id));
}

function toggleWatched(button, id) {
  if (watched.has(id)) watched.delete(id);
  else watched.add(id);
  try {
    localStorage.setItem(watchStorageKey, JSON.stringify([...watched]));
  } catch {
    // Keep the current page usable when browser storage is unavailable.
  }
  updateWatchButton(button, id);
  updateProgress();
}

function renderEpisodes() {
  const query = $('#episode-query').value.toLowerCase().trim();
  const season = $('#season').value;
  const list = includedEpisodes().filter(e =>
    (season === 'all' || e.season === Number(season)) &&
    `${e.name} ${code(e)}`.toLowerCase().includes(query)
  );
  updateProgress();
  $('#ep-count').textContent = `${list.length} episode${list.length === 1 ? '' : 's'} · Open an episode to reveal its summary`;
  $('.episodes').innerHTML = list.length ? list.map(e => `
    <div class="episode-row">
      <details class="episode" id="episode-${e.id}">
        <summary>
          <span class="ep-code">${code(e)}</span>
          <span class="ep-name" id="episode-name-${e.id}">${esc(e.name)} <span class="watched-label">✓ Watched</span></span>
          <span class="ep-date">${esc(e.airdate || 'Air date TBA')}${e.runtime ? ' · ' + e.runtime + ' min' : ''} &nbsp; +</span>
        </summary>
        <p>${esc(plain(e.summary) || 'No summary available for this episode.')}</p>
        <a href="${esc(e.url)}" target="_blank" rel="noopener">Episode on TVmaze ↗</a>
      </details>
      <button type="button" class="watch-button" data-episode-id="${e.id}" aria-describedby="episode-name-${e.id}"></button>
    </div>
  `).join('') : '<p>No matching episodes. Try another title or season.</p>';

  $('.episodes').querySelectorAll('.watch-button').forEach(button => {
    const id = Number(button.dataset.episodeId);
    updateWatchButton(button, id);
    button.onclick = () => toggleWatched(button, id);
  });
}

async function init(){const token=++request;$('#status').textContent='Loading a few favorites…';const results=await Promise.allSettled([305,36939,179,82,526].map(id=>api('/shows/'+id)));if(token!==request)return;const shows=results.filter(r=>r.status==='fulfilled').map(r=>r.value);cards(shows);$('#status').textContent=shows.length?'':'TVmaze could not be reached. Search for a show to try again.'}init();
