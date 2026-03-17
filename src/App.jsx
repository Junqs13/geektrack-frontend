import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [itens, setItens] = useState([]);
  const [categorias, setCategorias] = useState([]);

  const [novoItem, setNovoItem] = useState({
    titulo: '',
    tipo: '',
    foto_url: '',
    consumido: false,
    categoria_id: ''
  });

  const carregarDados = () => {
    axios.get('http://localhost:3001/itens')
      .then((response) => setItens(response.data))
      .catch((error) => console.error("Erro ao buscar itens:", error));

    axios.get('http://localhost:3001/categorias')
      .then((response) => setCategorias(response.data))
      .catch((error) => console.error("Erro ao buscar categorias:", error));
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNovoItem({
      ...novoItem,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!novoItem.titulo || !novoItem.tipo || !novoItem.categoria_id) {
      alert("Por favor, preencha o título, tipo e categoria.");
      return;
    }

    axios.post('http://localhost:3001/itens', novoItem)
      .then(() => {
        alert('Item cadastrado com sucesso!');
        carregarDados(); 
        setNovoItem({ titulo: '', tipo: '', foto_url: '', consumido: false, categoria_id: '' });
      })
      .catch((error) => {
        console.error("Erro ao cadastrar item:", error);
        alert('Ocorreu um erro ao salvar o item.');
      });
  };

  const deletarItem = (id) => {
    const confirmacao = window.confirm("Tem certeza que deseja remover este item do acervo?");
    if (confirmacao) {
      axios.delete(`http://localhost:3001/itens/${id}`)
        .then(() => carregarDados())
        .catch((error) => {
          console.error("Erro ao deletar item:", error);
          alert("Ocorreu um erro ao excluir o item.");
        });
    }
  };

  // --- NOVA FUNÇÃO: ATUALIZAR STATUS (PUT) ---
  const alternarConsumido = (item) => {
    // Montamos o objeto do item com o status 'consumido' invertido
    const itemAtualizado = {
      titulo: item.titulo,
      tipo: item.tipo,
      foto_url: item.foto_url,
      categoria_id: item.categoria_id,
      consumido: !item.consumido // Se era true vira false, se era false vira true
    };

    axios.put(`http://localhost:3001/itens/${item.id}`, itemAtualizado)
      .then(() => {
        carregarDados(); // Recarrega a lista para mostrar o novo status imediatamente
      })
      .catch((error) => {
        console.error("Erro ao atualizar item:", error);
        alert("Ocorreu um erro ao atualizar o status do item.");
      });
  };

  return (
    <div className="container" style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>Acervo GeekTrack</h1>
      <p style={{ textAlign: 'center' }}>Catálogo de Filmes, Músicas, Jogos e Quadrinhos</p>

      {/* SESSÃO DO FORMULÁRIO */}
      <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h2>Cadastrar Novo Item</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div>
            <label>Título:</label><br/>
            <input type="text" name="titulo" value={novoItem.titulo} onChange={handleInputChange} placeholder="Ex: The Dark Side of the Moon" style={{ width: '100%', padding: '8px' }} />
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <label>Tipo (Mídia):</label><br/>
              <select name="tipo" value={novoItem.tipo} onChange={handleInputChange} style={{ width: '100%', padding: '8px' }}>
                <option value="">Selecione...</option>
                <option value="Vinil">Vinil</option>
                <option value="CD">CD</option>
                <option value="Jogo">Jogo Físico</option>
                <option value="Quadrinho">Quadrinho/Mangá</option>
                <option value="Filme">DVD/Blu-Ray</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label>Categoria:</label><br/>
              <select name="categoria_id" value={novoItem.categoria_id} onChange={handleInputChange} style={{ width: '100%', padding: '8px' }}>
                <option value="">Selecione...</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label>URL da Foto (Capa):</label><br/>
            <input type="text" name="foto_url" value={novoItem.foto_url} onChange={handleInputChange} placeholder="http://link-da-imagem.jpg" style={{ width: '100%', padding: '8px' }} />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input type="checkbox" name="consumido" checked={novoItem.consumido} onChange={handleInputChange} />
              Já consumi este item (joguei/assisti/li/ouvi)
            </label>
          </div>

          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            Salvar Item no Acervo
          </button>
        </form>
      </div>

      {/* SESSÃO DA LISTAGEM */}
      <div className="lista-itens">
        <h2>Itens Cadastrados</h2>
        {itens.length === 0 ? (
          <p>Carregando acervo...</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {itens.map((item) => (
              <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #444', paddingBottom: '15px' }}>
                
                <div style={{ textAlign: 'left' }}>
                  <strong style={{ fontSize: '1.2rem' }}>{item.titulo}</strong> <br />
                  <span style={{ color: '#aaa' }}>Categoria: {item.categoria_nome} | Formato: {item.tipo}</span> <br />
                  <span style={{ color: item.consumido ? '#4CAF50' : '#FF9800', fontWeight: 'bold' }}>
                    {item.consumido ? '✅ Já consumido' : '⏳ Na fila para consumir'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  {/* NOVO BOTÃO DE ATUALIZAÇÃO */}
                  <button 
                    onClick={() => alternarConsumido(item)}
                    style={{ padding: '8px 12px', backgroundColor: item.consumido ? '#555' : '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    {item.consumido ? '↩️ Desmarcar' : '✅ Consumir'}
                  </button>

                  <button 
                    onClick={() => deletarItem(item.id)}
                    style={{ padding: '8px 12px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    🗑️ Excluir
                  </button>
                </div>

              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;