import React, { useEffect, useState, useContext } from 'react';
import Header from '../components/Header';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog';
import RecipeCard from '../components/RecipeCard';
import { AuthContext } from '../context/AuthContext';

export default function Dashboard(){
  const [recipes, setRecipes] = useState([]);
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const nav = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async() => {
    try {
      const res = await api.get('/recipes');
      setRecipes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const onDelete = (id) => setConfirm({ open: true, id });

  const confirmDelete = async (ok) => {
    if (!ok) return setConfirm({ open: false, id: null });
    try {
      await api.delete(`/recipes/${confirm.id}`);
      setRecipes(r => r.filter(x => x._id !== confirm.id));
    } catch (err) { console.error(err) }
    setConfirm({ open: false, id: null });
  };

  return (
    <div className="dashboard">
      <Header />
      <main className="dashboard-main">
        <div className="dashboard-left">
          <div className="user-info">
            <h3>Hello, {user?.name || user?.email}</h3>
            <p>Start a new chat or continue from saved recipes</p>
            <button className="btn-primary" onClick={() => nav('/chat')}>New Chat</button>
          </div>

          <section className="recipes-list">
            <h4>Your Recipes</h4>
            {recipes.length === 0 && <p>No recipes yet</p>}
            {recipes.map(r => (
              <RecipeCard
                key={r._id}
                recipe={r}
                onOpen={() => nav(`/chat/${r._id}`)}
                onDelete={() => onDelete(r._id)}
              />
            ))}
          </section>
        </div>

        <div className="dashboard-right">
          {/* placeholder for right panel or preview */}
          <div className="panel">
            <h4>Tips</h4>
            <p>Click a recipe to open chat or create a new recipe by starting a new chat.</p>
          </div>
        </div>
      </main>

      <ConfirmDialog open={confirm.open} onClose={() => confirmDelete(false)} onConfirm={() => confirmDelete(true)} message="Are you sure you want to delete this recipe?" />
    </div>
  );
}

