import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import Sidebar from "../components/Sidebar";
import { Users, GraduationCap, BookOpen, TrendingUp, Activity, Bell } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!user) {
    navigate("/");
    return null;
  }

  return (
    <div className="dashboard-container d-flex">
      <Sidebar />
      <div className="flex-grow-1 main-content">
        <div className="container-fluid p-4">
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
            <h1 className="h2 text-dark fw-semibold mb-2">Tableau de bord</h1>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="position-relative me-2">
                <Bell className="text-muted" size={20} />
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  4
                  <span className="visually-hidden">unread notifications</span>
                </span>
              </span>
              <button className="btn btn-outline-secondary me-2 d-none d-md-inline" onClick={logout}>Déconnexion</button>
              <span className="text-muted d-none d-md-inline">👤 Profile</span>
              <button className="btn btn-outline-secondary d-md-none" onClick={logout}>
                <span className="text-muted">🚪</span>
              </button>
            </div>
          </div>
          
          <p className="text-muted mb-4">Bienvenue sur UniGrade</p>

          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-md-3">
              <div className="card border-light shadow-sm p-3 h-100 card-hover">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-primary bg-opacity-10 p-2 rounded-3">
                    <Users className="text-primary" size={20} />
                  </div>
                  <div>
                    <p className="text-muted mb-1 small">Étudiants</p>
                    <p className="h5 fw-semibold text-dark">1,234</p>
                  </div>
                </div>
                <div className="text-primary small mt-2">+12% ce mois</div>
              </div>
            </div>
            
            <div className="col-12 col-sm-6 col-md-3">
              <div className="card border-light shadow-sm p-3 h-100 card-hover">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-success bg-opacity-10 p-2 rounded-3">
                    <GraduationCap className="text-success" size={20} />
                  </div>
                  <div>
                    <p className="text-muted mb-1 small">Professeurs</p>
                    <p className="h5 fw-semibold text-dark">89</p>
                  </div>
                </div>
                <div className="text-success small mt-2">+4% ce mois</div>
              </div>
            </div>
            
            <div className="col-12 col-sm-6 col-md-3">
              <div className="card border-light shadow-sm p-3 h-100 card-hover">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-purple bg-opacity-10 p-2 rounded-3">
                    <BookOpen className="text-purple" size={20} />
                  </div>
                  <div>
                    <p className="text-muted mb-1 small">Cours</p>
                    <p className="h5 fw-semibold text-dark">156</p>
                  </div>
                </div>
                <div className="text-purple small mt-2">+8% ce mois</div>
              </div>
            </div>
            
            <div className="col-12 col-sm-6 col-md-3">
              <div className="card border-light shadow-sm p-3 h-100 card-hover">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-warning bg-opacity-10 p-2 rounded-3">
                    <TrendingUp className="text-warning" size={20} />
                  </div>
                  <div>
                    <p className="text-muted mb-1 small">Moyenne</p>
                    <p className="h5 fw-semibold text-dark">3.8</p>
                  </div>
                </div>
                <div className="text-warning small mt-2">+2% ce semestre</div>
              </div>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <div className="card border-light shadow-sm p-3">
                <h2 className="h5 fw-semibold text-dark mb-3">Activité récente</h2>
                <div className="list-group">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="list-group-item list-group-item-action bg-light border-0 p-2 activity-item">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-primary bg-opacity-10 p-2 rounded-3">
                          <Activity className="text-primary" size={16} />
                        </div>
                        <div className="flex-grow-1">
                          <p className="mb-1 text-dark small fw-medium">Note mise à jour</p>
                          <p className="text-muted small">John Doe a mis à jour CS101</p>
                        </div>
                        <span className="text-muted small">2h</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="card border-light shadow-sm p-3">
                <h2 className="h5 fw-semibold text-dark mb-3">Performance par département</h2>
                <div className="mb-3">
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-muted small">Informatique</span>
                      <span className="text-dark small fw-medium">85%</span>
                    </div>
                    <div className="progress" style={{ height: '6px' }}>
                      <div className="progress-bar bg-primary" role="progressbar" style={{ width: '85%' }} aria-valuenow="85" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                  </div>
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-muted small">Ingénierie</span>
                      <span className="text-dark small fw-medium">92%</span>
                    </div>
                    <div className="progress" style={{ height: '6px' }}>
                      <div className="progress-bar bg-success" role="progressbar" style={{ width: '92%' }} aria-valuenow="92" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                  </div>
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-muted small">Commerce</span>
                      <span className="text-dark small fw-medium">78%</span>
                    </div>
                    <div className="progress" style={{ height: '6px' }}>
                      <div className="progress-bar bg-warning" role="progressbar" style={{ width: '78%' }} aria-valuenow="78" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <footer className="text-muted text-center py-3 small mt-5">
            © 2025 UniGrade. All rights reserved. | 
            <a href="/privacy" className="text-muted text-decoration-none mx-2">Privacy Policy</a> | 
            <a href="/terms" className="text-muted text-decoration-none mx-2">Terms of Service</a> | 
            <a href="/support" className="text-muted text-decoration-none mx-2">Contact Support</a>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;