import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [itens, setItens] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState({});

  const [novoItem, setNovoItem] = useState({
    titulo: '', tipo: '', foto_url: '', consumido: false, categoria_id: ''
  });

  const carregarDados = () => {
    axios.get('http://localhost:3001/itens').then((res) => setItens(res.data));
    axios.get('http://localhost:3001/categorias').then((res) => setCategorias(res.data));
    axios.get('http://localhost:3001/usuarios').then((res) => setUsuarios(res.data));
  };

  useEffect(() => { carregarDados(); }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNovoItem({ ...novoItem, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSelectUsuario = (itemId, usuarioId) => {
    setUsuarioSelecionado({ ...usuarioSelecionado, [itemId]: usuarioId });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('http://localhost:3001/itens', novoItem)
      .then(() => {
        carregarDados(); 
        setNovoItem({ titulo: '', tipo: '', foto_url: '', consumido: false, categoria_id: '' });
      });
  };

  const deletarItem = (id) => {
    if (window.confirm("Tem certeza que deseja remover este item?")) {
      axios.delete(`http://localhost:3001/itens/${id}`).then(() => carregarDados());
    }
  };

  const alternarConsumido = (item) => {
    const itemAtualizado = { ...item, consumido: !item.consumido };
    axios.put(`http://localhost:3001/itens/${item.id}`, itemAtualizado).then(() => carregarDados());
  };

  const registrarEmprestimo = (itemId) => {
    const usuarioId = usuarioSelecionado[itemId];
    if (!usuarioId) {
      alert("Selecione um usuário para emprestar!");
      return;
    }
    axios.post('http://localhost:3001/emprestar', { item_id: itemId, usuario_id: usuarioId })
      .then(() => {
        alert("Empréstimo registrado!");
        carregarDados();
      });
  };

  const registrarDevolucao = (emprestimoId) => {
    axios.put(`http://localhost:3001/devolver/${emprestimoId}`)
      .then(() => {
        alert("Devolução registrada com sucesso!");
        carregarDados();
      });
  };

  // --- LÓGICA DO DASHBOARD ---
  const totalItens = itens.length;
  const itensEmprestados = itens.filter(item => item.emprestado_para !== null).length;
  const itensDisponiveis = totalItens - itensEmprestados;

  return (
    <div className="container" style={{ maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '5px' }}>Acervo GeekTrack</h1>
      <p style={{ textAlign: 'center', color: '#888', marginTop: 0 }}>Gestão de Mídias e Colecionáveis</p>

      {/* --- SESSÃO DASHBOARD (RESUMO) --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', marginBottom: '30px', textAlign: 'center' }}>
        <div style={{ flex: 1, backgroundColor: '#2196F3', padding: '15px', borderRadius: '8px', color: 'white' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Total no Acervo</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{totalItens}</p>
        </div>
        <div style={{ flex: 1, backgroundColor: '#4CAF50', padding: '15px', borderRadius: '8px', color: 'white' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Disponíveis</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{itensDisponiveis}</p>
        </div>
        <div style={{ flex: 1, backgroundColor: '#FF9800', padding: '15px', borderRadius: '8px', color: 'white' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Emprestados</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{itensEmprestados}</p>
        </div>
      </div>

      {/* SESSÃO DO FORMULÁRIO */}
      <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h2 style={{ marginTop: 0 }}>Cadastrar Novo Item</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input type="text" name="titulo" value={novoItem.titulo} onChange={handleInputChange} placeholder="Título do Item" style={{ padding: '8px' }} required />
          <div style={{ display: 'flex', gap: '10px' }}>
            <select name="tipo" value={novoItem.tipo} onChange={handleInputChange} style={{ padding: '8px', flex: 1 }} required>
              <option value="">Tipo...</option>
              <option value="Vinil">Vinil</option><option value="Jogo">Jogo</option>
              <option value="Quadrinho">Quadrinho</option><option value="Filme">Filme</option>
            </select>
            <select name="categoria_id" value={novoItem.categoria_id} onChange={handleInputChange} style={{ padding: '8px', flex: 1 }} required>
              <option value="">Categoria...</option>
              {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
            </select>
          </div>
          <button type="submit" style={{ padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px' }}>Salvar</button>
        </form>
      </div>

      {/* SESSÃO DA LISTAGEM */}
      <div className="lista-itens">
        <h2>Inventário do Acervo</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {itens.map((item) => (
            <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #444', paddingBottom: '15px' }}>
              
              <div style={{ textAlign: 'left', flex: 1 }}>
                <strong style={{ fontSize: '1.2rem' }}>{item.titulo}</strong> <br />
                <span style={{ color: '#aaa' }}>{item.categoria_nome} | {item.tipo}</span> <br />
                <span style={{ color: item.consumido ? '#4CAF50' : '#FF9800', fontSize: '0.9em' }}>
                  {item.consumido ? '✅ Consumido' : '⏳ Na fila'}
                </span>
              </div>

              {/* LÓGICA DE EMPRÉSTIMO E ALERTA VISUAL */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#2a2a2a', padding: '10px', borderRadius: '8px', marginRight: '15px' }}>
                {item.emprestado_para ? (
                  <>
                    <span style={{ color: '#FFC107', fontWeight: 'bold' }}>⚠️ Com {item.emprestado_para}</span>
                    <button onClick={() => registrarDevolucao(item.emprestimo_id)} style={{ padding: '5px 10px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      Devolver
                    </button>
                  </>
                ) : (
                  <>
                    <span style={{ color: '#4CAF50' }}>✓ Disponível</span>
                    <select onChange={(e) => handleSelectUsuario(item.id, e.target.value)} value={usuarioSelecionado[item.id] || ""} style={{ padding: '5px' }}>
                      <option value="">Emprestar para...</option>
                      {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                    </select>
                    <button onClick={() => registrarEmprestimo(item.id)} style={{ padding: '5px 10px', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      Confirmar
                    </button>
                  </>
                )}
              </div>

              {/* BOTÕES DE GERENCIAMENTO */}
              <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
                <button onClick={() => alternarConsumido(item)} style={{ padding: '5px', backgroundColor: '#555', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  🔄 Status
                </button>
                <button onClick={() => deletarItem(item.id)} style={{ padding: '5px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  🗑️ Excluir
                </button>
              </div>

            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;