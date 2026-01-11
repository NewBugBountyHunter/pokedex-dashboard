import { useState, useEffect, useRef } from 'react'
import './App.css'
import api from './services/api'

const pokeballImages = {
  "Poke ball": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png",
  "Great Ball": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png",
  "Ultra Ball": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png",
  "Master Ball": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png",
  "Quick Ball": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/quick-ball.png",
  "Dusk Ball": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dusk-ball.png",
  "Net Ball": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/net-ball.png"
};

function App() {
  const [loading, setLoading] = useState(false)
  const [pokemons, setPokemons] = useState([])
  const [offset, setOffset] = useState(0)
  const [busca, setBusca] = useState('')
  const [listaReferencia, setListaReferencia] = useState([])
  const [pokemonSelecionado, setPokemonSelecionado] = useState(null)

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef(null);

  const playlist = Array.from({ length: 20 }, (_, i) => ({
    title: `Abertura ${i + 1}`,
    src: `/musics/Abertura${i + 1}.mp3`
  }));

  const togglePlay = () => {
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    setIsPlaying(true);
  };

  const handleTimeUpdate = () => {
    const current = audioRef.current.currentTime;
    const duration = audioRef.current.duration;
    if (duration) setProgress((current / duration) * 100);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
    if (newVolume > 0) setIsMuted(false);
  };

  useEffect(() => {
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    }
  }, [currentTrackIndex, isPlaying]);

  useEffect(() => {
    async function carregarReferencia() {
      try {
        const response = await api.get('pokemon?limit=10000');
        setListaReferencia(response.data.results);
      } catch (error) {
        console.error('Erro ao carregar nomes:', error);
      }
    }
    carregarReferencia();
  }, []);

  useEffect(() => {
    async function loadPokemons() {
      if (loading) return;
      setLoading(true);
      try {
        const response = await api.get(`pokemon?limit=60&offset=${offset}`);
        const listaBasica = response.data.results;
        
        const consultasDetalhes = listaBasica.map(async (p) => {
          const resPokemon = await api.get(p.url);
          const resSpecies = await api.get(`pokemon-species/${resPokemon.data.id}`);
          
          let pokebolaIdeal = "Poke ball";
          const catchRate = resSpecies.data.capture_rate;
          const habitat = resSpecies.data.habitat ? resSpecies.data.habitat.name : "Desconhecido";

          if (resSpecies.data.is_legendary || resSpecies.data.is_mythical) {
            pokebolaIdeal = "Master Ball";
          } else if (habitat === "waters-edge" || habitat === "sea") {
            pokebolaIdeal = "Net Ball";
          } else if (habitat === "cave") {
            pokebolaIdeal = "Dusk Ball";
          } else if (catchRate < 45) {
            pokebolaIdeal = "Ultra Ball";
          } else if (catchRate < 120) {
            pokebolaIdeal = "Great Ball";
          } else if (catchRate >= 200) {
            pokebolaIdeal = "Quick Ball";
          }
          
          return { ...resPokemon.data, pokebolaIdeal };
        });

        const dadosCompletos = await Promise.all(consultasDetalhes);
        setPokemons((prev) => [...prev, ...dadosCompletos]);
      } catch (error) {
        console.error('Erro ao carregar pokémons:', error);
      } finally {
        setLoading(false);
      }
    }

    if (busca === '') loadPokemons();
  }, [offset, busca, loading]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const currentPosition = window.innerHeight + document.documentElement.scrollTop;
      const scrollPercentage = currentPosition / scrollHeight;

      if (scrollPercentage > 0.6 && !loading && busca === '') { 
          setOffset((prev) => prev + 60);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, busca]);

  const abrirModal = async (pokemon, imagem) => {
    try {
      const id = pokemon.id || (pokemon.url.split('/')[6]);
      const [resSpecies, resPokemon] = await Promise.all([
        api.get(`pokemon-species/${id}`),
        api.get(`pokemon/${id}`)
      ]);

      const entradasPT = resSpecies.data.flavor_text_entries.find(
        (e) => e.language.name === 'pt-br' || e.language.name === 'pt'
      );
      
      let textoFinal = "";

      if (entradasPT) {
        textoFinal = entradasPT.flavor_text.replace(/[\n\f]/g, ' ');
      } else {
        const textoEN = resSpecies.data.flavor_text_entries.find((e) => e.language.name === 'en')?.flavor_text.replace(/[\n\f]/g, ' ');
        if (textoEN) {
          const traducao = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textoEN)}&langpair=en|pt-BR`);
          const dadosTraduzidos = await traducao.json();
          textoFinal = dadosTraduzidos.responseData.translatedText;
        }
      }

      const habilidades = resPokemon.data.abilities
        .map(a => a.ability.name.replace('-', ' '))
        .join(', ');

      const habitat = resSpecies.data.habitat ? resSpecies.data.habitat.name : "Desconhecido";
      const catchRate = resSpecies.data.capture_rate;

      let pokebolaIdeal = "Poke ball";

      if (resSpecies.data.is_legendary || resSpecies.data.is_mythical) {
        pokebolaIdeal = "Master Ball";
      } else if (habitat === "waters-edge" || habitat === "sea") {
        pokebolaIdeal = "Net Ball";
      } else if (habitat === "cave") {
        pokebolaIdeal = "Dusk Ball";
      } else if (catchRate < 45) {
        pokebolaIdeal = "Ultra Ball";
      } else if (catchRate < 120) {
        pokebolaIdeal = "Great Ball";
      } else if (catchRate >= 200) {
        pokebolaIdeal = "Quick Ball" ;
      }

      setPokemonSelecionado({
        nome: pokemon.name,
        foto: imagem,
        descricao: textoFinal || "Descrição não disponível.",
        habilidades: habilidades,
        regiao: habitat,
        captura: catchRate,
        pokebola: pokebolaIdeal,
      });
    } catch (error) {
      console.error("Erro ao carregar detalhes ", error);
    }
  };

  const pokemonsExibidos = busca === '' 
    ? pokemons 
    : listaReferencia.filter(p => p.name.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="container">
      <video autoPlay loop muted playsInline className="background-video">
        <source src="/bg-pokemon.mp4" type="video/mp4" />    
      </video>

      <div className="music-player-container">
        <audio 
          ref={audioRef} 
          src={playlist[currentTrackIndex].src} 
          onTimeUpdate={handleTimeUpdate}
          onEnded={nextTrack}
          muted={isMuted}
        />
        <div className="player-main-row">
          <button onClick={prevTrack} className="nav-btn">⏮</button>
          <div className="play-button-wrapper">
            <button onClick={togglePlay} className="play-btn">{isPlaying ? "⏸" : "▶"}</button>
          </div>
          <button onClick={nextTrack} className="nav-btn">⏭</button>
          <div className="volume-control">
            <button onClick={() => setIsMuted(!isMuted)} className="mute-btn">
              {isMuted || volume === 0 ? "🔇" : "🔊"}
            </button>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1" 
              value={isMuted ? 0 : volume} 
              onChange={handleVolumeChange} 
              className="volume-slider" 
            />
          </div>
        </div>
        <div className="progress-bar-container">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="track-title">{playlist[currentTrackIndex].title}</p>
      </div>

      <header className="search-container">
        <h1>Pokedex Dashboard</h1>
        <input
          type="text"
          className="search-input"
          placeholder="Pesquisar pokémon..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </header>

      <div className="pokemon-list">
        {pokemonsExibidos.map((pokemon, index) => {
          const id = pokemon.id || pokemon.url.split('/')[6];
          const imagemUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
          const fotoFinal = pokemon.sprites ? pokemon.sprites.other['official-artwork'].front_default : imagemUrl;

          return (
            <div key={`${id}-${index}`} className="pokemon-card" onClick={() => abrirModal(pokemon, fotoFinal)}>
              <img src={fotoFinal} alt={pokemon.name} />
              <h3>{pokemon.name}</h3>
              <div className="pokeball-icon-container">
                <img
                  src={pokeballImages[pokemon.pokebolaIdeal || "Poke ball"]}
                  alt="Pokebola"
                  className="pokeball-icon"
                />
              </div>
            </div>
          );
        })}
      </div>

      {pokemonSelecionado && (
        <div className="modal-overlay" onClick={() => setPokemonSelecionado(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={pokemonSelecionado.foto} alt={pokemonSelecionado.nome} />
            <div className="modal-info">
              <h2>{pokemonSelecionado.nome}</h2>
              <div className="modal-stats-row">
                <span><strong>Habilidades:</strong> {pokemonSelecionado.habilidades}</span>
                <span><strong>Habitat:</strong> {pokemonSelecionado.regiao}</span>
                <span><strong>Taxa de Captura:</strong> {pokemonSelecionado.captura}</span>
                <span><strong>Pokébola Ideal:</strong> {pokemonSelecionado.pokebola}</span>
              </div>
              <p className="modal-description">{pokemonSelecionado.descricao}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App;