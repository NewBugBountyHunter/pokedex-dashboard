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

const tipos = [
  { name: 'all', label: 'TODOS', icon: 'https://cdn-icons-png.flaticon.com/512/188/188970.png' },
  { name: 'fire', label: 'FOGO', icon: 'https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/fire.svg' },
  { name: 'water', label: 'ÁGUA', icon: 'https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/water.svg' },
  { name: 'grass', label: 'PLANTA', icon: 'https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/grass.svg' },
  { name: 'electric', label: 'RAIO', icon: 'https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/electric.svg' },
  { name: 'ice', label: 'GELO', icon: 'https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/ice.svg' },
  { name: 'fighting', label: 'LUTA', icon: 'https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/fighting.svg' },
  { name: 'poison', label: 'VENENO', icon: 'https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/poison.svg' },
  { name: 'ground', label: 'TERRA', icon: 'https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/ground.svg' },
  { name: 'flying', label: 'VOAR', icon: 'https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/flying.svg' },
  { name: 'psychic', label: 'PSÍQUICO', icon: 'https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/psychic.svg' },
  { name: 'bug', label: 'INSETO', icon: 'https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/bug.svg' },
  { name: 'rock', label: 'PEDRA', icon: 'https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/rock.svg' },
  { name: 'ghost', label: 'FANTASMA', icon: 'https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/ghost.svg' },
  { name: 'dragon', label: 'DRAGÃO', icon: 'https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/dragon.svg' },
  { name: 'steel', label: 'AÇO', icon: 'https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/steel.svg' }
];

function App() {
  const [loading, setLoading] = useState(false)
  const [pokemons, setPokemons] = useState([])
  const [offset, setOffset] = useState(0)
  const [busca, setBusca] = useState('')
  const [tipoSelecionado, setTipoSelecionado] = useState('all');
  const [listaReferencia, setListaReferencia] = useState([])
  const [pokemonSelecionado, setPokemonSelecionado] = useState(null)

  const carregandoRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef(null);

  const playlist = Array.from({ length: 19 }, (_, index) => ({
    title: `Abertura ${index + 1}`,
    src: `/musics/Abertura${index + 1}.mp3`
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

  const handleVolumeChange = (evento) => {
    const newVolume = parseFloat(evento.target.value);
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
      if (carregandoRef.current) return;
      
      carregandoRef.current = true;
      setLoading(true);

      try {
        const response = await api.get(`pokemon?limit=60&offset=${offset}`);
        const listaBasica = response.data.results;
        
        const consultasDetalhes = listaBasica.map(async (pokemonIndividual) => {
          const resPokemon = await api.get(pokemonIndividual.url);
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
          
          const entradas = resSpecies.data.flavor_text_entries;
          const entradaFinal = entradas.find(entradaTexto => entradaTexto.language.name === 'pt-br' || entradaTexto.language.name === 'pt') 
                               || entradas.find(entradaTexto => entradaTexto.language.name === 'en');
          
          return { 
            ...resPokemon.data, 
            pokebolaIdeal,
            descricaoPrevia: entradaFinal ? entradaFinal.flavor_text.replace(/[\n\f]/g, ' ') : "Descrição não disponível.",
            habitatPrevia: habitat,
            catchRatePrevia: catchRate
          };
        });

        const dadosCompletos = await Promise.all(consultasDetalhes);
        
        setPokemons((prev) => {
          const idsExistentes = new Set(prev.map(pokemonExistente => pokemonExistente.id));
          const novosPokemons = dadosCompletos.filter(novoPokemon => !idsExistentes.has(novoPokemon.id));
          return [...prev, ...novosPokemons];
        });

      } catch (error) {
        console.error('Erro ao carregar pokémons:', error);
      } finally {
        setLoading(false);
        carregandoRef.current = false;
      }
    }

    if (busca === '') loadPokemons();
  }, [offset, busca]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const currentPosition = window.innerHeight + document.documentElement.scrollTop;
      
      if (currentPosition / scrollHeight > 0.8 && !carregandoRef.current && busca === '') { 
          setOffset((prev) => prev + 60);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [busca]);

  const abrirModal = async (pokemon, imagem) => {
    if (pokemon.descricaoPrevia && pokemon.descricaoPrevia !== "Descrição não disponível.") {
        setPokemonSelecionado({
            nome: pokemon.name,
            foto: imagem,
            descricao: pokemon.descricaoPrevia,
            habilidades: pokemon.abilities.map(habilidadeItem => habilidadeItem.ability.name.replace('-', ' ')).join(', '),
            regiao: pokemon.habitatPrevia,
            captura: pokemon.catchRatePrevia,
            pokebola: pokemon.pokebolaIdeal,
        });
        return;
    }

    try {
      const id = pokemon.id || (pokemon.url.split('/')[6]);
      const [resSpecies, resPokemon] = await Promise.all([
        api.get(`pokemon-species/${id}`),
        api.get(`pokemon/${id}`)
      ]);

      const entradas = resSpecies.data.flavor_text_entries;
      const entradaFinal = entradas.find(entradaTexto => entradaTexto.language.name === 'pt-br' || entradaTexto.language.name === 'pt') 
                               || entradas.find(entradaTexto => entradaTexto.language.name === 'en');
      
      let textoFinal = entradaFinal ? entradaFinal.flavor_text.replace(/[\n\f]/g, ' ') : "Descrição não disponível.";

      setPokemonSelecionado({
        nome: pokemon.name,
        foto: imagem,
        descricao: textoFinal,
        habilidades: resPokemon.data.abilities.map(habilidadeItem => habilidadeItem.ability.name.replace('-', ' ')).join(', '),
        regiao: resSpecies.data.habitat?.name || "Desconhecido",
        captura: resSpecies.data.capture_rate,
        pokebola: pokemon.pokebolaIdeal || "Poke ball",
      });
    } catch (erroApi) { console.error(erroApi); }
  };

  const pokemonsExibidos = (busca === '' 
    ? pokemons 
    : listaReferencia.filter(pokemonItem => pokemonItem.name.toLowerCase().includes(busca.toLowerCase()))
  ).filter(pokemonFiltro => tipoSelecionado === 'all' || (pokemonFiltro.types && pokemonFiltro.types.some(tipoObjeto => tipoObjeto.type.name === tipoSelecionado)));

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
          onChange={(eventoInput) => setBusca(eventoInput.target.value)}
        />
      </header>

      <div className="categories-grid">
        {tipos.map(tipoItem => (
          <button 
            key={tipoItem.name} 
            className={`category-card ${tipoSelecionado === tipoItem.name ? 'active' : ''}`}
            onClick={() => setTipoSelecionado(tipoItem.name)}
          >
            <img src={tipoItem.icon} alt={tipoItem.label} className="category-icon" />
            <span>{tipoItem.label}</span>
          </button>
        ))}
      </div>

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

      {loading && (
        <div style={{ color: 'white', margin: '20px', fontWeight: 'bold' }}>
          CARREGANDO...
        </div>
      )}

      {pokemonSelecionado && (
        <div className="modal-overlay" onClick={() => setPokemonSelecionado(null)}>
          <div className="modal-content" onClick={(eventoModal) => eventoModal.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setPokemonSelecionado(null)}>×</button>
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