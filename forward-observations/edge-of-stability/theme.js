if (new URLSearchParams(location.search).get('theme') === 'dark') {
  document.documentElement.dataset.theme = 'dark';
  const player = document.getElementById('player');
  if (player) player.setAttribute('src', `${player.getAttribute('src')}?theme=dark`);
  const still = document.querySelector('.fallback');
  if (still) still.src = still.getAttribute('src').replace('.svg','-dark.svg');
}
