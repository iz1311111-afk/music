import GridMaker from './GridMaker';

export default function Home() {
  return (
    <>
      <header>
        <h1>Music<span>Grid</span> <small style={{fontSize:11,color:'var(--muted)'}}>β</small></h1>
        <p>聴いてきた音楽で、自分を語ろう。</p>
      </header>
      <GridMaker />
      <footer>MusicGrid β — アートワークは iTunes Search API より取得しています</footer>
    </>
  );
}
