import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // O CSS das notificações
import './App.css';
const API_URL = import.meta.env.VITE_API_URL; // Ou process.env.REACT_APP_API_URL se for CRA

function App() {
  // ==========================================
  // ESTADOS DE AUTENTICAÇÃO
  // ==========================================
  const [usuarioLogado, setUsuarioLogado] = useState(() => {
    const salvo = localStorage.getItem('@geektrack:user');
    return salvo ? JSON.parse(salvo) : null;
  });
  const [loginForm, setLoginForm] = useState({ email: '', senha: '' });

  // ==========================================
  // ESTADOS DA APLICAÇÃO
  // ==========================================
  const [telaAtual, setTelaAtual] = useState('acervo'); 
  const [itens, setItens] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [estatisticas, setEstatisticas] = useState(null); 
  const [usuarioSelecionado, setUsuarioSelecionado] = useState({});
  const [historicos, setHistoricos] = useState({}); 
  const fileInputRef = useRef(null); 
  const [carregando, setCarregando] = useState(false);
  
  const [novoItem, setNovoItem] = useState({ titulo: '', tipo: '', consumido: false, categoria_id: '' });
  const [foto, setFoto] = useState(null); 
  const [novoUsuario, setNovoUsuario] = useState({ nome: '', email: '', senha: '', perfil: 'membro' });
  
  const [editandoId, setEditandoId] = useState(null); // Estado para controlar a edição
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  // ==========================================
  // BUSCA DE DADOS
  // ==========================================
  const carregarDados = async () => {
    if (!usuarioLogado) return;

    setCarregando(true); 
    try {
      const resItens = await axios.get('${API_URL}/itens');
      const resCat = await axios.get('${API_URL}/categorias');
      setItens(resItens.data);
      setCategorias(resCat.data);
      
      if (usuarioLogado.perfil === 'admin') {
        const resUsuarios = await axios.get('${API_URL}/usuarios');
        const resEstat = await axios.get('${API_URL}/estatisticas');
        setUsuarios(resUsuarios.data);
        setEstatisticas(resEstat.data);
      }
    } catch (erro) {
      toast.error('Erro ao buscar dados do servidor!');
    } finally {
      setCarregando(false); 
    }
  };

  useEffect(() => { 
    carregarDados(); 
  }, [usuarioLogado]);

  // ==========================================
  // FUNÇÃO DE LOGIN
  // ==========================================
  const handleLogin = (e) => {
    e.preventDefault();
    axios.post('${API_URL}/login', loginForm)
      .then(res => {
        setUsuarioLogado(res.data);
        localStorage.setItem('@geektrack:user', JSON.stringify(res.data));
        setTelaAtual('acervo');
      })
      .catch(() => toast.error('E-mail ou senha incorretos!'));
  };

  // ==========================================
  // FUNÇÕES DE ITENS (ACERVO)
  // ==========================================
  const handleItemInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNovoItem({ ...novoItem, [name]: type === 'checkbox' ? checked : value });
  };

  const handleFileChange = (e) => setFoto(e.target.files[0]);

  // Prepara o formulário para editar um item existente
  const prepararEdicao = (item) => {
    setEditandoId(item.id);
    setNovoItem({
      titulo: item.titulo,
      tipo: item.tipo,
      consumido: item.consumido,
      categoria_id: item.categoria_id,
      foto_url_existente: item.foto_url 
    });
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  // Limpa o formulário e sai do modo de edição
  const cancelarEdicao = () => {
    setEditandoId(null);
    setNovoItem({ titulo: '', tipo: '', consumido: false, categoria_id: '' });
    setFoto(null);
    if (fileInputRef.current) fileInputRef.current.value = ""; 
  };

  const handleItemSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('titulo', novoItem.titulo);
    formData.append('tipo', novoItem.tipo);
    formData.append('categoria_id', novoItem.categoria_id);
    formData.append('consumido', novoItem.consumido);
    if (foto) formData.append('foto', foto); 

    if (editandoId) {
      // MODO EDIÇÃO
      if (novoItem.foto_url_existente) formData.append('foto_url_existente', novoItem.foto_url_existente);
      
      axios.put(`${API_URL}/itens/${editandoId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' }})
        .then(() => {
          carregarDados(); 
          cancelarEdicao();
          toast.success('Item atualizado com sucesso!');
        }).catch(() => toast.error('Erro ao atualizar o item.'));
    } else {
      // MODO CRIAÇÃO
      axios.post('${API_URL}/itens', formData, { headers: { 'Content-Type': 'multipart/form-data' }})
        .then(() => {
          carregarDados(); 
          cancelarEdicao();
          toast.success('Item adicionado ao acervo!');
        }).catch(() => toast.error('Erro ao salvar o item.'));
    }
  };

  const deletarItem = (id) => {
    if (window.confirm("Remover este item do acervo?")) {
      axios.delete(`${API_URL}/itens/${id}`)
        .then(() => {
          carregarDados();
          toast.success('Item removido com sucesso!');
        })
        .catch((erro) => {
          // Apanha a mensagem de bloqueio enviada pelo Node.js e mostra-a no ecrã
          const mensagemErro = erro.response?.data?.erro || 'Erro desconhecido ao remover o item.';
          toast.error(mensagemErro);
        });
    }
  };

  const alternarConsumido = (item) => {
    const formData = new FormData();
    formData.append('titulo', item.titulo);
    formData.append('tipo', item.tipo);
    formData.append('categoria_id', item.categoria_id);
    formData.append('consumido', !item.consumido);
    if (item.foto_url) formData.append('foto_url_existente', item.foto_url);
    
    axios.put(`${API_URL}/itens/${item.id}`, formData).then(() => carregarDados());
  };

  // ==========================================
  // FUNÇÕES DE EMPRÉSTIMOS E DEVOLUÇÕES
  // ==========================================
  const handleSelectUsuario = (itemId, usuarioId) => setUsuarioSelecionado({ ...usuarioSelecionado, [itemId]: usuarioId });

  const registrarEmprestimo = (itemId) => {
    const usuarioId = parseInt(usuarioSelecionado[itemId], 10);
    
    if (!usuarioId || isNaN(usuarioId)) {
      return toast.warning("Selecione um utilizador na lista antes de emprestar!");
    }
    
    const idToast = toast.loading("Registando empréstimo...");

    axios.post(`${API_URL}/emprestar`, { item_id: itemId, usuario_id: usuarioId })
      .then(() => { 
        carregarDados(); 
        toast.update(idToast, { render: "Empréstimo registado com sucesso!", type: "success", isLoading: false, autoClose: 3000 });
        setUsuarioSelecionado({ ...usuarioSelecionado, [itemId]: "" });
      })
      .catch((erro) => {
        const msg = erro.response?.data?.erro || 'Erro ao comunicar com o servidor.';
        toast.update(idToast, { render: `Erro: ${msg}`, type: "error", isLoading: false, autoClose: 4000 });
      });
  };

  const registrarDevolucao = (emprestimoId) => {
    axios.put(`${API_URL}/devolver/${emprestimoId}`)
      .then(() => { 
        carregarDados(); 
        toast.success('Devolução registada!'); 
      })
      .catch(() => toast.error('Erro ao registar devolução.'));
  };

  const toggleHistorico = (itemId) => {
    if (historicos[itemId]) {
      const novosHistoricos = { ...historicos };
      delete novosHistoricos[itemId];
      setHistoricos(novosHistoricos);
    } else {
      axios.get(`${API_URL}/itens/${itemId}/historico`)
        .then(res => {
          const dadosSeguros = Array.isArray(res.data) ? res.data : [];
          setHistoricos({ ...historicos, [itemId]: dadosSeguros });
        })
        .catch(() => toast.error('Erro ao comunicar com o servidor de histórico.'));
    }
  };

  // ==========================================
  // FUNÇÕES DE MEMBROS (USUÁRIOS)
  // ==========================================
  const handleUsuarioInputChange = (e) => {
    setNovoUsuario({ ...novoUsuario, [e.target.name]: e.target.value });
  };

  const handleUsuarioSubmit = (e) => {
    e.preventDefault();
    axios.post('${API_URL}/usuarios', novoUsuario)
      .then(() => {
        toast.success('Membro cadastrado com sucesso!');
        carregarDados();
        setNovoUsuario({ nome: '', email: '', senha: '', perfil: 'membro' });
      })
      .catch((erro) => {
        const mensagemErro = erro.response?.data?.erro || erro.message || 'Erro desconhecido';
        toast.error(`Erro: ${mensagemErro}`);
      });
  };

  const deletarUsuario = (id) => {
    if (window.confirm("Tem a certeza que deseja excluir este membro?")) {
      axios.delete(`${API_URL}/usuarios/${id}`)
        .then(() => {
          carregarDados();
          toast.success('Membro removido com sucesso!');
        })
        .catch((erro) => {
          const mensagemErro = erro.response?.data?.erro || 'Erro desconhecido ao remover.';
          toast.error(mensagemErro);
        });
    }
  };

  // ==========================================
  // CÁLCULOS E FILTROS
  // ==========================================
  const formatarData = (dataStr) => {
    if (!dataStr) return '';
    return new Date(dataStr).toLocaleDateString('pt-BR');
  };

  const totalItens = itens.length;
  const itensEmprestados = itens.filter(item => item.emprestado_para !== null).length;
  const itensDisponiveis = totalItens - itensEmprestados;

  const itensFiltrados = itens.filter(item => {
    const matchBusca = item.titulo.toLowerCase().includes(termoBusca.toLowerCase());
    const matchCategoria = filtroCategoria === '' ? true : item.categoria_id.toString() === filtroCategoria;
    let matchStatus = true;
    if (filtroStatus === 'disponivel') matchStatus = item.emprestado_para === null;
    if (filtroStatus === 'emprestado') matchStatus = item.emprestado_para !== null;
    return matchBusca && matchCategoria && matchStatus;
  });

  // ==========================================
  // TELA DE LOGIN (Se não estiver logado)
  // ==========================================
  if (!usuarioLogado) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#121212' }}>
        <div style={{ backgroundColor: '#1e1e1e', padding: '40px', borderRadius: '12px', textAlign: 'center', width: '350px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
          <h1 style={{ color: '#6200ea', margin: 0, fontSize: '2.5rem' }}>GeekTrack</h1>
          <p style={{ color: '#aaa', marginBottom: '30px' }}>Gestão de Acervo Físico</p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="email" placeholder="E-mail" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: 'white' }} required />
            <input type="password" placeholder="Senha (ex: 123456)" value={loginForm.senha} onChange={e => setLoginForm({...loginForm, senha: e.target.value})} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: 'white' }} required />
            <button type="submit" style={{ padding: '15px', backgroundColor: '#6200ea', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem' }}>Entrar</button>
          </form>
        </div>
        <ToastContainer theme="dark" position="bottom-right" />
      </div>
    );
  }

  const isAdmin = usuarioLogado.perfil === 'admin';

  // ==========================================
  // RENDERIZAÇÃO DA APLICAÇÃO PRINCIPAL
  // ==========================================
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>GeekTrack</h1>
        <p>Bem-vindo(a), <strong>{usuarioLogado.nome}</strong> | Perfil: {usuarioLogado.perfil.toUpperCase()}</p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '20px', flexWrap: 'wrap' }}>
          <button onClick={() => setTelaAtual('acervo')} className={`nav-btn ${telaAtual === 'acervo' ? 'active' : ''}`}>📚 Acervo</button>
          
          {isAdmin && (
            <>
              <button onClick={() => setTelaAtual('membros')} className={`nav-btn ${telaAtual === 'membros' ? 'active' : ''}`}>👥 Membros</button>
              <button onClick={() => setTelaAtual('dashboard')} className={`nav-btn ${telaAtual === 'dashboard' ? 'active' : ''}`}>📊 Relatórios</button>
            </>
          )}

          <button onClick={() => {
            setUsuarioLogado(null);
            localStorage.removeItem('@geektrack:user');
          }} style={{ padding: '12px 24px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Sair</button>
        </div>
      </header>

      {/* ======================================= */}
      {/* TELA 1: ACERVO (Visível para todos)     */}
      {/* ======================================= */}
      {telaAtual === 'acervo' && (
        <>
          {isAdmin && (
            <>
              <div className="dashboard">
                <div className="dash-card blue"><h3>Total no Acervo</h3><p>{totalItens}</p></div>
                <div className="dash-card green"><h3>Disponíveis</h3><p>{itensDisponiveis}</p></div>
                <div className="dash-card orange"><h3>Emprestados</h3><p>{itensEmprestados}</p></div>
              </div>

              <div className="form-container">
                <h2>{editandoId ? '✏️ Editando Item...' : 'Cadastrar Novo Item'}</h2>
                <form onSubmit={handleItemSubmit} className="geek-form">
                  <div className="form-group"><input type="text" name="titulo" value={novoItem.titulo} onChange={handleItemInputChange} placeholder="Título da obra" required /></div>
                  <div className="form-row">
                    <select name="tipo" value={novoItem.tipo} onChange={handleItemInputChange} required>
                      <option value="">Formato da Mídia...</option><option value="Vinil">Vinil</option><option value="Jogo Físico">Jogo Físico</option><option value="Quadrinho/Mangá">Quadrinho/Mangá</option><option value="Filme (DVD/Blu-Ray)">Filme (DVD/Blu-Ray)</option><option value="CD">CD</option><option value="Livro">Livro</option>
                    </select>
                    <select name="categoria_id" value={novoItem.categoria_id} onChange={handleItemInputChange} required>
                      <option value="">Categoria...</option>{categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="file-input-wrapper">
                      <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} />
                      {editandoId && <small style={{display: 'block', marginTop: '5px', color: '#aaa'}}>Deixe em branco para manter a foto atual.</small>}
                    </div>
                    <label className="checkbox-label"><input type="checkbox" name="consumido" checked={novoItem.consumido} onChange={handleItemInputChange} />Já consumi</label>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="btn-salvar" style={{ flex: 2 }}>
                      {editandoId ? 'Guardar Alterações' : 'Adicionar ao Acervo'}
                    </button>
                    {editandoId && (
                      <button type="button" onClick={cancelarEdicao} className="btn-outline" style={{ flex: 1, padding: '15px', borderRadius: '6px' }}>
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </>
          )}

          <div className="acervo-section">
            <h2>Catálogo Disponível</h2>
            
            <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
              <input type="text" placeholder="🔍 Buscar por título..." value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} style={{ flex: 2, padding: '12px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: 'white', minWidth: '200px' }} />
              <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: 'white', minWidth: '150px' }}>
                <option value="">📂 Todas as Categorias</option>{categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
              </select>
              <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: 'white', minWidth: '150px' }}>
                <option value="">⚡ Todos os Status</option><option value="disponivel">✅ Disponíveis</option><option value="emprestado">⚠️ Emprestados</option>
              </select>
            </div>

            {itensFiltrados.length === 0 && <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#1e1e1e', borderRadius: '8px', color: '#888' }}><h3>Nenhum item encontrado. 😢</h3></div>}

            <div className="itens-grid">
              {itensFiltrados.map((item) => {
                let estaAtrasado = false;
                let diasEmprestado = 0;
                if (item.emprestado_para && item.data_emprestimo) {
                  diasEmprestado = Math.floor((new Date() - new Date(item.data_emprestimo)) / (1000 * 60 * 60 * 24));
                  estaAtrasado = diasEmprestado > 14;
                }

                return (
                  <div className={`item-card ${estaAtrasado ? 'atrasado' : ''}`} key={item.id}>
                    <div className="card-image">
                      {item.foto_url ? <img src={item.foto_url} alt="Capa" /> : <div className="no-image">Sem Capa</div>}
                      <div className={`status-badge ${item.consumido ? 'badge-green' : 'badge-orange'}`}>{item.consumido ? '✓ Consumido' : '⏳ Na fila'}</div>
                    </div>
                    <div className="card-content">
                      <h3 className="item-title">{item.titulo}</h3>
                      <p className="item-meta">{item.categoria_nome} • {item.tipo}</p>
                      
                      <div className="emprestimo-box" style={{ backgroundColor: item.emprestado_para ? 'rgba(255,171,0,0.1)' : 'rgba(76,175,80,0.1)' }}>
                        {item.emprestado_para ? (
                          <div className="emprestado-status">
                            <div>
                              <span style={{ color: estaAtrasado ? '#ff1744' : '#ffab00' }}>
                                <strong>{isAdmin ? (estaAtrasado ? `⚠️ ATRASO (${diasEmprestado} dias)` : `⚠️ Com: ${item.emprestado_para}`) : '⚠️ Indisponível'}</strong>
                              </span>
                              {isAdmin && <><br/><small>Desde: {formatarData(item.data_emprestimo)}</small></>}
                            </div>
                            {isAdmin && <button onClick={() => registrarDevolucao(item.emprestimo_id)} className="btn-devolver">Devolver</button>}
                          </div>
                        ) : (
                          <>
                            {isAdmin ? (
                              <div className="emprestar-actions">
                                <select onChange={(e) => handleSelectUsuario(item.id, e.target.value)} value={usuarioSelecionado[item.id] || ""}><option value="">Emprestar para...</option>{usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}</select>
                                <button onClick={() => registrarEmprestimo(item.id)} className="btn-emprestar">OK</button>
                              </div>
                            ) : (
                              <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>✅ Disponível</span>
                            )}
                          </>
                        )}
                      </div>

                      {isAdmin && (
                        <>
                          <div className="card-actions" style={{ marginTop: '10px' }}>
                            <button onClick={() => alternarConsumido(item)} className="btn-outline">🔄 Status</button>
                            <button onClick={() => prepararEdicao(item)} className="btn-outline">✏️ Editar</button>
                            <button onClick={() => toggleHistorico(item.id)} className="btn-outline">📝 Histórico</button>
                            <button onClick={() => deletarItem(item.id)} className="btn-danger">🗑️ Excluir</button>
                          </div>
                          
                          {historicos[item.id] && Array.isArray(historicos[item.id]) && (
                            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#111', borderRadius: '6px', fontSize: '0.85rem' }}>
                              <strong style={{ display: 'block', marginBottom: '5px' }}>Histórico:</strong>
                              {historicos[item.id].length === 0 ? (
                                <p style={{ margin: 0, color: '#888' }}>Nenhum empréstimo registado.</p>
                              ) : (
                                <ul style={{ paddingLeft: '15px', margin: 0, color: '#aaa' }}>
                                  {historicos[item.id].map((h, i) => (
                                    <li key={i}>
                                      <strong>{h.usuario_nome}</strong> ({formatarData(h.data_emprestimo)} a {h.data_devolucao ? formatarData(h.data_devolucao) : 'Atual'})
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ======================================= */}
      {/* TELA 2: MEMBROS (Apenas Admin)          */}
      {/* ======================================= */}
      {telaAtual === 'membros' && isAdmin && (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="form-container">
            <h2>Cadastrar Novo Membro</h2>
            <form onSubmit={handleUsuarioSubmit} className="geek-form">
              <input type="text" name="nome" value={novoUsuario.nome} onChange={handleUsuarioInputChange} placeholder="Nome completo" required />
              <input type="email" name="email" value={novoUsuario.email} onChange={handleUsuarioInputChange} placeholder="E-mail de contacto" required />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" name="senha" value={novoUsuario.senha} onChange={handleUsuarioInputChange} placeholder="Senha (vazio = 123456)" style={{ flex: 1 }} />
                <select name="perfil" value={novoUsuario.perfil} onChange={handleUsuarioInputChange} style={{ flex: 1 }}>
                  <option value="membro">Membro Comum</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <button type="submit" className="btn-salvar">Adicionar Membro</button>
            </form>
          </div>

          <div className="acervo-section" style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '12px' }}>
            <h2>Membros Registados ({usuarios.length})</h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {usuarios.map(user => (
                <li key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderBottom: '1px solid #333' }}>
                  <div>
                    <strong style={{ fontSize: '1.2rem' }}>{user.nome}</strong> <span style={{ fontSize: '0.8rem', backgroundColor: user.perfil === 'admin' ? '#6200ea' : '#555', padding: '2px 6px', borderRadius: '4px', marginLeft: '5px' }}>{user.perfil}</span><br/>
                    <span style={{ color: '#aaa' }}>{user.email}</span>
                  </div>
                  <button onClick={() => deletarUsuario(user.id)} className="btn-danger" style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>🗑️ Remover</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* TELA 3: DASHBOARD (Apenas Admin)        */}
      {/* ======================================= */}
      {telaAtual === 'dashboard' && isAdmin && estatisticas && (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
          
          <div style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '12px', marginBottom: '30px' }}>
             <h2 style={{ marginTop: 0, marginBottom: '10px' }}>📈 Saúde do Acervo</h2>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#aaa' }}>
                <span>Disponível: {((itensDisponiveis / totalItens) * 100 || 0).toFixed(1)}%</span>
                <span>Emprestado: {((itensEmprestados / totalItens) * 100 || 0).toFixed(1)}%</span>
             </div>
             <div style={{ height: '24px', backgroundColor: '#ffab00', borderRadius: '12px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${(itensDisponiveis / totalItens) * 100}%`, backgroundColor: '#00c853', transition: 'width 1s ease-in-out' }}></div>
             </div>
             <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '10px', textAlign: 'center' }}>
                A barra verde representa os itens que estão fisicamente na Associação neste momento.
             </p>
          </div>

          <div style={{ backgroundColor: '#ff1744', padding: '20px', borderRadius: '12px', marginBottom: '30px', color: 'white' }}>
            <h2 style={{ marginTop: 0 }}>⚠️ Alertas de Inadimplência</h2>
            {estatisticas.atrasados.length === 0 ? (
              <p style={{ margin: 0, fontSize: '1.1rem' }}>✅ Fantástico! Todos os itens estão dentro do prazo de 14 dias.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {estatisticas.atrasados.map((item, i) => (
                  <li key={i} style={{ padding: '15px', backgroundColor: 'rgba(0,0,0,0.3)', marginBottom: '10px', borderRadius: '6px' }}>
                    <strong style={{ fontSize: '1.2rem' }}>{item.titulo}</strong> — Com: {item.usuario} <br/>
                    <em style={{ color: '#ffcdd2' }}>Atrasado há {item.dias_atraso - 14} dias (Desde: {formatarData(item.data_emprestimo)})</em>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '300px', backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '12px' }}>
              <h2 style={{ marginTop: 0, borderBottom: '1px solid #333', paddingBottom: '10px' }}>🏆 Top 5: Itens Mais Cobiçados</h2>
              <ol style={{ paddingLeft: '20px', color: '#aaa', margin: 0 }}>
                {estatisticas.topItens.map((item, i) => (
                  <li key={i} style={{ marginBottom: '15px' }}>
                    <strong style={{ color: 'white', fontSize: '1.1rem' }}>{item.titulo}</strong> <br/>
                    Emprestado {item.total_vezes} vezes
                  </li>
                ))}
                {estatisticas.topItens.length === 0 && <p>Nenhum empréstimo registado ainda.</p>}
              </ol>
            </div>

            <div style={{ flex: 1, minWidth: '300px', backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '12px' }}>
              <h2 style={{ marginTop: 0, borderBottom: '1px solid #333', paddingBottom: '10px' }}>🌟 Top 5: Membros Mais Ativos</h2>
              <ol style={{ paddingLeft: '20px', color: '#aaa', margin: 0 }}>
                {estatisticas.topUsuarios.map((user, i) => (
                  <li key={i} style={{ marginBottom: '15px' }}>
                    <strong style={{ color: 'white', fontSize: '1.1rem' }}>{user.nome}</strong> <br/>
                    Pegou {user.total_pegos} itens
                  </li>
                ))}
                {estatisticas.topUsuarios.length === 0 && <p>Nenhum membro ativo ainda.</p>}
              </ol>
            </div>
          </div>
        </div>
      )}

      <ToastContainer theme="dark" position="bottom-right" />
    </div>
  );
}

export default App;