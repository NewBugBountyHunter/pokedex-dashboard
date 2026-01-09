import { useState, useEffect } from 'react'
import './App.css'
import api from './services/api'

function App() {
  const [loading, setLoading] = useState(false)
  const [pokemons, setPokemons] = useState([])
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    async function loadPokemons() {
      if (loading) return

      setLoading(true)

      try {
        const response = await api.get(`pokemon?limit=20&offset=${offset}`)
        const listaBasica = response.data.results

        const consultasDetalhes = listaBasica.map((pokemon) =>
          api.get(pokemon.url)
        )

        const respostasDetalhes = await Promise.all(consultasDetalhes)
        const dadosCompletos = respostasDetalhes.map((res) => res.data)

        setPokemons((prev) => [...prev, ...dadosCompletos])
      } catch (error) {
        console.error('Erro ao carregar:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPokemons()
  }, [offset])

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 1 >=
        document.documentElement.scrollHeight - 300
      ) {
        setOffset((prevOffset) => prevOffset + 20)
      }
    }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading]); 

  return (
    <div className="container">
      <h1>Pokedex Dashboard</h1>

      <div className="pokemon-list">
        {pokemons.map((pokemon) => (
          <div key={pokemon.id} className="pokemon-card">
            <img 
              src={pokemon.sprites.other['official-artwork'].front_default} 
              alt={pokemon.name} 
            />
            <h3>{pokemon.name}</h3>
          </div>
        ))}

        {loading && <p className="loading">Carregando mais pokémons...</p>}
      </div>
    </div>
  )
}

export default App;