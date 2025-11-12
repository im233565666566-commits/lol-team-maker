import React, { useState, useEffect } from 'react';
import { Users, RefreshCw, Trophy, MessageSquare, FileText, ArrowLeftRight, Bell, Edit, User } from 'lucide-react';

const POSITIONS = ['탑', '정글', '미드', '원딜', '서폿'];
const TIERS = ['아이언', '브론즈', '실버', '골드', '플래티넘', '에메랄드', '다이아', '마스터', '그랜드마스터', '챌린저'];

const LoLTeamMaker = () => {
  const [step, setStep] = useState('setup');
  const [matchFormat, setMatchFormat] = useState('bo5');
  const [players, setPlayers] = useState([]);
  const [currentUser, setCurrentUser] = useState('');
  const [newPlayer, setNewPlayer] = useState({ 
    name: '', 
    mainPosition: '', 
    mainTier: '', 
    subPosition1: '', 
    subTier1: '', 
    subPosition2: '', 
    subTier2: '' 
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const [team1, setTeam1] = useState([]);
  const [team2, setTeam2] = useState([]);
  const [team1Name] = useState('바위게팀');
  const [team2Name] = useState('돌거북팀');
  const [currentGame, setCurrentGame] = useState(1);
  const [team1Wins, setTeam1Wins] = useState(0);
  const [team2Wins, setTeam2Wins] = useState(0);
  const [gamePhase, setGamePhase] = useState('playing');
  const [banPick, setBanPick] = useState({ 
    team1Bans: ['', '', '', '', ''], 
    team2Bans: ['', '', '', '', ''],
    team1Picks: ['', '', '', '', ''], 
    team2Picks: ['', '', '', '', ''] 
  });
  const [winner, setWinner] = useState('');
  const [matchHistory, setMatchHistory] = useState([]);
  const [tradeMode, setTradeMode] = useState(false);
  const [selectedForTrade, setSelectedForTrade] = useState(null);
  const [matchWinner, setMatchWinner] = useState('');
  const [notification, setNotification] = useState(null);
  const [hasUnseenChanges, setHasUnseenChanges] = useState(false);

  const maxWins = matchFormat === 'bo5' ? 3 : 2;

  // 로컬 스토리지에서 플레이어 정보 및 현재 유저 로드
  useEffect(() => {
    const savedPlayers = localStorage.getItem('lol_players');
    if (savedPlayers) {
      setPlayers(JSON.parse(savedPlayers));
    }
    const savedUser = localStorage.getItem('lol_current_user');
    if (savedUser) {
      setCurrentUser(savedUser);
    }
  }, []);

  // 플레이어 정보 저장
  useEffect(() => {
    if (players.length > 0) {
      localStorage.setItem('lol_players', JSON.stringify(players));
    }
  }, [players]);

  // 현재 유저 저장
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('lol_current_user', currentUser);
    }
  }, [currentUser]);

  // 변경사항 감지
  useEffect(() => {
    if (matchHistory.length > 0) {
      setHasUnseenChanges(true);
    }
  }, [matchHistory, team1, team2]);

  const getTierValue = (tier) => TIERS.indexOf(tier);

  const addOrUpdatePlayer = () => {
    if (newPlayer.name && newPlayer.mainPosition && newPlayer.mainTier) {
      const mainTierValue = getTierValue(newPlayer.mainTier);
      
      let validatedPlayer = { ...newPlayer };
      
      if (newPlayer.subPosition1 && newPlayer.subTier1) {
        const subTier1Value = getTierValue(newPlayer.subTier1);
        if (subTier1Value > mainTierValue) {
          validatedPlayer.subTier1 = newPlayer.mainTier;
        }
      }
      
      if (newPlayer.subPosition2 && newPlayer.subTier2) {
        const subTier2Value = getTierValue(newPlayer.subTier2);
        if (subTier2Value > mainTierValue) {
          validatedPlayer.subTier2 = newPlayer.mainTier;
        }
      }
      
      if (editingIndex !== null) {
        const updatedPlayers = [...players];
        updatedPlayers[editingIndex] = validatedPlayer;
        setPlayers(updatedPlayers);
        setEditingIndex(null);
      } else {
        setPlayers([...players, validatedPlayer]);
      }
      
      setNewPlayer({ 
        name: '', 
        mainPosition: '', 
        mainTier: '', 
        subPosition1: '', 
        subTier1: '', 
        subPosition2: '', 
        subTier2: '' 
      });
    }
  };

  const editPlayer = (index) => {
    setNewPlayer(players[index]);
    setEditingIndex(index);
  };

  const removePlayer = (index) => {
    const updatedPlayers = players.filter((_, i) => i !== index);
    setPlayers(updatedPlayers);
    if (updatedPlayers.length === 0) {
      localStorage.removeItem('lol_players');
    }
  };

  const selectCurrentUser = (playerName) => {
    setCurrentUser(playerName);
    showNotification(`${playerName}님으로 설정되었습니다!`);
  };

  const createTeams = () => {
    if (players.length < 10) {
      alert('10명의 플레이어가 필요합니다!');
      return;
    }

    if (!currentUser) {
      alert('본인 확인을 먼저 해주세요!');
      return;
    }

    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const t1 = [];
    const t2 = [];
    const usedPositions = { t1: new Set(), t2: new Set() };

    shuffled.forEach((player, index) => {
      const team = index < 5 ? t1 : t2;
      const positions = index < 5 ? usedPositions.t1 : usedPositions.t2;
      
      let assignedPosition = player.mainPosition;
      if (positions.has(player.mainPosition)) {
        if (player.subPosition1 && !positions.has(player.subPosition1)) {
          assignedPosition = player.subPosition1;
        } else if (player.subPosition2 && !positions.has(player.subPosition2)) {
          assignedPosition = player.subPosition2;
        } else {
          const available = POSITIONS.find(pos => !positions.has(pos));
          assignedPosition = available || player.mainPosition;
        }
      }
      
      positions.add(assignedPosition);
      team.push({ ...player, assignedPosition });
    });

    setTeam1(t1);
    setTeam2(t2);
    setStep('teams');
    showNotification(`${team1Name} vs ${team2Name} 팀이 생성되었습니다!`);
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const submitGameResult = () => {
    if (!winner) {
      alert('승리팀을 선택해주세요!');
      return;
    }

    const newWins = winner === 'team1' ? team1Wins + 1 : team2Wins + 1;
    if (winner === 'team1') {
      setTeam1Wins(newWins);
    } else {
      setTeam2Wins(newWins);
    }

    const gameLog = {
      gameNumber: currentGame,
      team1Bans: banPick.team1Bans.filter(b => b),
      team2Bans: banPick.team2Bans.filter(b => b),
      team1Picks: banPick.team1Picks.filter(p => p),
      team2Picks: banPick.team2Picks.filter(p => p),
      team1: [...team1],
      team2: [...team2],
      winner: winner,
      team1Wins: winner === 'team1' ? newWins : team1Wins,
      team2Wins: winner === 'team2' ? newWins : team2Wins,
      trades: []
    };

    setMatchHistory([...matchHistory, gameLog]);
    setHasUnseenChanges(true);
    showNotification(`게임 ${currentGame} 결과가 기록되었습니다!`);

    if (newWins >= maxWins) {
      setMatchWinner(winner === 'team1' ? team1Name : team2Name);
      setStep('matchComplete');
    } else {
      setGamePhase('fa');
    }
  };

  const startNextGame = () => {
    setCurrentGame(currentGame + 1);
    setGamePhase('playing');
    setBanPick({ 
      team1Bans: ['', '', '', '', ''], 
      team2Bans: ['', '', '', '', ''],
      team1Picks: ['', '', '', '', ''], 
      team2Picks: ['', '', '', '', ''] 
    });
    setWinner('');
    setTradeMode(false);
    setSelectedForTrade(null);
    showNotification(`게임 ${currentGame + 1}이 시작됩니다!`);
  };

  const handleTrade = (team, playerIndex) => {
    if (!selectedForTrade) {
      setSelectedForTrade({ team, playerIndex });
    } else {
      if (selectedForTrade.team === team) {
        setSelectedForTrade(null);
        return;
      }

      const newTeam1 = [...team1];
      const newTeam2 = [...team2];

      if (selectedForTrade.team === 'team1') {
        const temp = newTeam1[selectedForTrade.playerIndex];
        newTeam1[selectedForTrade.playerIndex] = newTeam2[playerIndex];
        newTeam2[playerIndex] = temp;
      } else {
        const temp = newTeam2[selectedForTrade.playerIndex];
        newTeam2[selectedForTrade.playerIndex] = newTeam1[playerIndex];
        newTeam1[playerIndex] = temp;
      }

      setTeam1(newTeam1);
      setTeam2(newTeam2);
      setSelectedForTrade(null);

      const lastLog = matchHistory[matchHistory.length - 1];
      if (lastLog) {
        const player1 = selectedForTrade.team === 'team1' ? team1[selectedForTrade.playerIndex] : team2[selectedForTrade.playerIndex];
        const player2 = team === 'team1' ? team1[playerIndex] : team2[playerIndex];
        lastLog.trades.push({
          from: player1.name,
          to: player2.name
        });
        setHasUnseenChanges(true);
      }

      showNotification('트레이드가 완료되었습니다!');
    }
  };

  const openTeamChat = (teamName) => {
    const teamMembers = teamName === team1Name ? team1 : team2;
    const chatWindow = window.open('', `${teamName}_채팅`, 'width=500,height=700');
    
    chatWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${teamName} 채팅방</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: ${teamName === team1Name ? 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)' : 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)'};
            color: white;
            height: 100vh;
            display: flex;
            flex-direction: column;
          }
          .header {
            background: rgba(0,0,0,0.3);
            padding: 20px;
            border-bottom: 2px solid rgba(255,255,255,0.1);
          }
          .header h1 { font-size: 24px; margin-bottom: 10px; }
          .members {
            background: rgba(0,0,0,0.2);
            padding: 10px;
            border-radius: 8px;
            margin-top: 10px;
          }
          .member-list { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 8px; 
            margin-top: 8px;
          }
          .member-tag {
            background: rgba(255,255,255,0.2);
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 13px;
          }
          .current-user {
            background: rgba(255,215,0,0.3);
            border: 2px solid gold;
            font-weight: bold;
          }
          .messages {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .message {
            background: rgba(255,255,255,0.1);
            padding: 12px;
            border-radius: 12px;
            backdrop-filter: blur(10px);
          }
          .message-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            font-size: 12px;
            opacity: 0.8;
          }
          .message-sender {
            font-weight: bold;
            color: #fbbf24;
          }
          .message-time { opacity: 0.6; }
          .message-text {
            font-size: 15px;
            line-height: 1.4;
          }
          .input-area {
            background: rgba(0,0,0,0.3);
            padding: 20px;
            border-top: 2px solid rgba(255,255,255,0.1);
            display: flex;
            gap: 10px;
          }
          input {
            flex: 1;
            padding: 12px;
            border: none;
            border-radius: 8px;
            background: rgba(255,255,255,0.15);
            color: white;
            font-size: 14px;
          }
          input::placeholder { color: rgba(255,255,255,0.5); }
          button {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            background: rgba(255,255,255,0.25);
            color: white;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
          }
          button:hover { background: rgba(255,255,255,0.35); }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${teamName} 채팅방</h1>
          <div class="members">
            <div style="font-size: 14px; opacity: 0.8;">참가 인원</div>
            <div class="member-list">
              ${teamMembers.map(m => `
                <span class="member-tag ${m.name === currentUser ? 'current-user' : ''}">
                  ${m.name}${m.name === currentUser ? ' (나)' : ''}
                </span>
              `).join('')}
            </div>
          </div>
        </div>
        <div class="messages" id="messages"></div>
        <div class="input-area">
          <input type="text" id="messageInput" placeholder="메시지를 입력하세요..." />
          <button onclick="sendMessage()">전송</button>
        </div>
        <script>
          const currentUser = '${currentUser}';
          const messages = [];
          
          function sendMessage() {
            const input = document.getElementById('messageInput');
            const text = input.value.trim();
            if (!text) return;
            
            const message = {
              sender: currentUser,
              text: text,
              time: new Date().toLocaleTimeString()
            };
            
            messages.push(message);
            displayMessages();
            input.value = '';
            input.focus();
          }
          
          function displayMessages() {
            const container = document.getElementById('messages');
            container.innerHTML = messages.map(msg => \`
              <div class="message">
                <div class="message-header">
                  <span class="message-sender">\${msg.sender}</span>
                  <span class="message-time">\${msg.time}</span>
                </div>
                <div class="message-text">\${msg.text}</div>
              </div>
            \`).join('');
            container.scrollTop = container.scrollHeight;
          }
          
          document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
          });
          
          document.getElementById('messageInput').focus();
        </script>
      </body>
      </html>
    `);
    chatWindow.document.close();
  };

  const resetMatch = () => {
    if (confirm('경기를 초기화하시겠습니까? (플레이어 정보는 유지됩니다)')) {
      setStep('setup');
      setTeam1([]);
      setTeam2([]);
      setCurrentGame(1);
      setTeam1Wins(0);
      setTeam2Wins(0);
      setGamePhase('playing');
      setBanPick({ 
        team1Bans: ['', '', '', '', ''], 
        team2Bans: ['', '', '', '', ''],
        team1Picks: ['', '', '', '', ''], 
        team2Picks: ['', '', '', '', ''] 
      });
      setWinner('');
      setMatchHistory([]);
      setTradeMode(false);
      setSelectedForTrade(null);
      setMatchWinner('');
      setHasUnseenChanges(false);
    }
  };

  const clearNotification = () => {
    setHasUnseenChanges(false);
  };

  const updateBanPick = (team, type, index, value) => {
    setBanPick(prev => ({
      ...prev,
      [`${team}${type}`]: prev[`${team}${type}`].map((item, i) => i === index ? value : item)
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-4 md:p-8">
      {notification && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
          {notification}
        </div>
      )}

      {hasUnseenChanges && step === 'teams' && (
        <div className="fixed top-20 right-4 z-50">
          <button
            onClick={clearNotification}
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-4 rounded-lg shadow-lg font-bold flex items-center gap-2 animate-pulse"
          >
            <Bell size={24} />
            변경사항 확인
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <Trophy className="text-yellow-400" />
            롤 내전 팀짜기 시스템
          </h1>
          {step !== 'setup' && (
            <button
              onClick={resetMatch}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
            >
              <RefreshCw size={20} />
              경기 초기화
            </button>
          )}
        </div>

        {step === 'teams' && (
          <div className="bg-slate-800 rounded-lg p-4 mb-6">
            <div className="flex justify-center items-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{team1Name}</div>
                <div className="text-4xl font-bold mt-2">{team1Wins}</div>
              </div>
              <div className="text-3xl font-bold">VS</div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{team2Name}</div>
                <div className="text-4xl font-bold mt-2">{team2Wins}</div>
              </div>
            </div>
            <div className="text-center mt-4 text-xl text-gray-400">
              게임 {currentGame} | {matchFormat === 'bo5' ? '5전 3승' : '3전 2승'}
            </div>
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: maxWins }).map((_, i) => (
                <div key={`t1-${i}`} className={`w-8 h-8 rounded-full ${i < team1Wins ? 'bg-blue-500' : 'bg-gray-600'}`}></div>
              ))}
              <div className="w-2"></div>
              {Array.from({ length: maxWins }).map((_, i) => (
                <div key={`t2-${i}`} className={`w-8 h-8 rounded-full ${i < team2Wins ? 'bg-red-500' : 'bg-gray-600'}`}></div>
              ))}
            </div>
          </div>
        )}

        {step === 'setup' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">경기 형식 선택</h2>
              <div className="flex gap-4">
                <button
                  onClick={() => setMatchFormat('bo5')}
                  className={`px-6 py-3 rounded-lg font-bold transition ${
                    matchFormat === 'bo5' ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  5전 3승제
                </button>
                <button
                  onClick={() => setMatchFormat('bo3')}
                  className={`px-6 py-3 rounded-lg font-bold transition ${
                    matchFormat === 'bo3' ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  3전 2승제
                </button>
              </div>
            </div>

            {currentUser && (
              <div className="bg-green-900 border-2 border-green-600 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <User className="text-green-400" size={24} />
                  <div>
                    <div className="text-sm text-green-400">현재 접속자</div>
                    <div className="text-xl font-bold">{currentUser}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">플레이어 {editingIndex !== null ? '수정' : '추가'}</h2>
              <p className="text-sm text-gray-400 mb-4">* 주포지션과 티어는 필수이며, 부포지션은 선택사항입니다.</p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="소환사명*"
                    value={newPlayer.name}
                    onChange={(e) => setNewPlayer({...newPlayer, name: e.target.value})}
                    className="px-4 py-3 bg-slate-700 rounded-lg text-lg"
                  />
                  
                  <select
                    value={newPlayer.mainPosition}
                    onChange={(e) => setNewPlayer({...newPlayer, mainPosition: e.target.value})}
                    className="px-4 py-3 bg-slate-700 rounded-lg text-lg"
                  >
                    <option value="">주포지션 선택*</option>
                    {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                  </select>
                  
                  <select
                    value={newPlayer.mainTier}
                    onChange={(e) => setNewPlayer({...newPlayer, mainTier: e.target.value})}
                    className="px-4 py-3 bg-slate-700 rounded-lg text-lg"
                  >
                    <option value="">주포지션 티어*</option>
                    {TIERS.map(tier => <option key={tier} value={tier}>{tier}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">부포지션 1 (선택)</label>
                    <div className="flex gap-2">
                      <select
                        value={newPlayer.subPosition1}
                        onChange={(e) => setNewPlayer({...newPlayer, subPosition1: e.target.value})}
                        className="flex-1 px-4 py-2 bg-slate-700 rounded-lg"
                      >
                        <option value="">포지션</option>
                        {POSITIONS.filter(pos => pos !== newPlayer.mainPosition).map(pos => <option key={pos} value={pos}>{pos}</option>)}
                      </select>
                      <select
                        value={newPlayer.subTier1}
                        onChange={(e) => setNewPlayer({...newPlayer, subTier1: e.target.value})}
                        className="flex-1 px-4 py-2 bg-slate-700 rounded-lg"
                      >
                        <option value="">티어</option>
                        {TIERS.map(tier => <option key={tier} value={tier}>{tier}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">부포지션 2 (선택)</label>
                    <div className="flex gap-2">
                      <select
                        value={newPlayer.subPosition2}
                        onChange={(e) => setNewPlayer({...newPlayer, subPosition2: e.target.value})}
                        className="flex-1 px-4 py-2 bg-slate-700 rounded-lg"
                      >
                        <option value="">포지션</option>
                        {POSITIONS.filter(pos => pos !== newPlayer.mainPosition && pos !== newPlayer.subPosition1).map(pos => <option key={pos} value={pos}>{pos}</option>)}
                      </select>
                      <select
                        value={newPlayer.subTier2}
                        onChange={(e) => setNewPlayer({...newPlayer, subTier2: e.target.value})}
                        className="flex-1 px-4 py-2 bg-slate-700 rounded-lg"
                      >
                        <option value="">티어</option>
                        {TIERS.map(tier => <option key={tier} value={tier}>{tier}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  onClick={addOrUpdatePlayer}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-xl transition"
                >
                  {editingIndex !== null ? '수정 완료' : '플레이어 추가'}
                </button>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">등록된 플레이어 ({players.length}/10)</h3>
              {!currentUser && players.length > 0 && (
                <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="text-yellow-400" />
                    <span className="font-bold text-yellow-400">본인 확인이 필요합니다</span>
                  </div>
                  <p className="text-sm text-yellow-200">아래 목록에서 본인을 선택해주세요</p>
                </div>
              )}
              <div className="space-y-2">
                {players.map((player, index) => (
                  <div key={index} className={`flex justify-between items-center p-4 rounded ${
                    currentUser === player.name ? 'bg-green-800 border-2 border-green-500' : 'bg-slate-700'
                  }`}>
                    <div className="flex items-center gap-3">
                      {!currentUser && (
                        <button
                          onClick={() => selectCurrentUser(player.name)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm font-bold transition"
                        >
                          본인 선택
                        </button>
                      )}
                      {currentUser === player.name && (
                        <span className="px-3 py-1 bg-green-600 rounded text-sm font-bold">나</span>
                      )}
                      <div>
                        <span className="font-bold text-lg">{player.name}</span>
                        <span className="text-gray-400 ml-3">
                          {player.mainPosition} ({player.mainTier})
                          {player.subPosition1 && ` | ${player.subPosition1} (${player.subTier1})`}
                          {player.subPosition2 && ` | ${player.subPosition2} (${player.subTier2})`}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editPlayer(index)}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded transition flex items-center gap-2"
                      >
                        <Edit size={16} />
                        수정
                      </button>
                      <button
                        onClick={() => removePlayer(index)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {players.length === 10 && (
              <button
                onClick={createTeams}
                className="w-full py-4 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-xl transition"
              >
                팀 생성하기
              </button>
            )}
          </div>
        )}

        {step === 'teams' && (
          <div className="space-y-6">
            {gamePhase === 'playing' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-900 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-2xl font-bold">{team1Name}</h3>
                      <button
                        onClick={() => openTeamChat(team1Name)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg transition"
                      >
                        <MessageSquare size={20} />
                        팀 채팅
                      </button>
                    </div>
                    {team1.map((player, index) => (
                      <div key={index} className={`p-3 rounded mb-2 ${
                        player.name === currentUser ? 'bg-blue-700 border-2 border-yellow-400' : 'bg-blue-800'
                      }`}>
                        <div className="font-bold">{player.assignedPosition}</div>
                        <div className="flex items-center gap-2">
                          {player.name}
                          {player.name === currentUser && <span className="text-yellow-400 text-sm">(나)</span>}
                          <span className="text-sm opacity-75">({player.mainTier})</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-red-900 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-2xl font-bold">{team2Name}</h3>
                      <button
                        onClick={() => openTeamChat(team2Name)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 rounded-lg transition"
                      >
                        <MessageSquare size={20} />
                        팀 채팅
                      </button>
                    </div>
                    {team2.map((player, index) => (
                      <div key={index} className={`p-3 rounded mb-2 ${
                        player.name === currentUser ? 'bg-red-700 border-2 border-yellow-400' : 'bg-red-800'
                      }`}>
                        <div className="font-bold">{player.assignedPosition}</div>
                        <div className="flex items-center gap-2">
                          {player.name}
                          {player.name === currentUser && <span className="text-yellow-400 text-sm">(나)</span>}
                          <span className="text-sm opacity-75">({player.mainTier})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-700 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4">밴픽 기록</h3>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-bold text-blue-300 mb-2">{team1Name} 밴</h4>
                      <div className="grid grid-cols-5 gap-2">
                        {banPick.team1Bans.map((ban, i) => (
                          <input
                            key={i}
                            type="text"
                            placeholder={`밴 ${i + 1}`}
                            value={ban}
                            onChange={(e) => updateBanPick('team1', 'Bans', i, e.target.value)}
                            className="px-3 py-2 bg-slate-800 border border-red-900 rounded text-center focus:border-red-500 focus:outline-none"
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-blue-300 mb-2">{team1Name} 픽</h4>
                      <div className="grid grid-cols-5 gap-2">
                        {banPick.team1Picks.map((pick, i) => (
                          <input
                            key={i}
                            type="text"
                            placeholder={`픽 ${i + 1}`}
                            value={pick}
                            onChange={(e) => updateBanPick('team1', 'Picks', i, e.target.value)}
                            className="px-3 py-2 bg-slate-800 border border-blue-900 rounded text-center focus:border-blue-500 focus:outline-none"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-slate-600 pt-6">
                      <h4 className="font-bold text-red-300 mb-2">{team2Name} 밴</h4>
                      <div className="grid grid-cols-5 gap-2">
                        {banPick.team2Bans.map((ban, i) => (
                          <input
                            key={i}
                            type="text"
                            placeholder={`밴 ${i + 1}`}
                            value={ban}
                            onChange={(e) => updateBanPick('team2', 'Bans', i, e.target.value)}
                            className="px-3 py-2 bg-slate-800 border border-red-900 rounded text-center focus:border-red-500 focus:outline-none"
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-red-300 mb-2">{team2Name} 픽</h4>
                      <div className="grid grid-cols-5 gap-2">
                        {banPick.team2Picks.map((pick, i) => (
                          <input
                            key={i}
                            type="text"
                            placeholder={`픽 ${i + 1}`}
                            value={pick}
                            onChange={(e) => updateBanPick('team2', 'Picks', i, e.target.value)}
                            className="px-3 py-2 bg-slate-800 border border-red-900 rounded text-center focus:border-red-500 focus:outline-none"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex gap-4">
                    <button
                      onClick={() => setWinner('team1')}
                      className={`flex-1 py-4 rounded-lg font-bold text-lg transition ${
                        winner === 'team1' ? 'bg-blue-600' : 'bg-slate-600 hover:bg-slate-500'
                      }`}
                    >
                      {team1Name} 승리
                    </button>
                    <button
                      onClick={() => setWinner('team2')}
                      className={`flex-1 py-4 rounded-lg font-bold text-lg transition ${
                        winner === 'team2' ? 'bg-red-600' : 'bg-slate-600 hover:bg-slate-500'
                      }`}
                    >
                      {team2Name} 승리
                    </button>
                  </div>

                  <button
                    onClick={submitGameResult}
                    className="w-full mt-4 py-4 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-lg transition"
                  >
                    게임 결과 제출
                  </button>
                </div>
              </div>
            )}

            {gamePhase === 'fa' && (
              <div className="space-y-6">
                <div className="bg-slate-700 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold">FA 시장 & 트레이드</h3>
                    <button
                      onClick={() => setTradeMode(!tradeMode)}
                      className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 ${
                        tradeMode ? 'bg-yellow-600' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      <ArrowLeftRight size={20} />
                      {tradeMode ? '트레이드 취소' : '트레이드 모드'}
                    </button>
                  </div>
                  
                  {tradeMode && (
                    <p className="text-yellow-400 mb-4">
                      트레이드할 두 명의 플레이어를 순서대로 선택하세요. (다른 포지션도 가능)
                    </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-900 rounded-lg p-4">
                      <h4 className="text-xl font-bold mb-3">{team1Name}</h4>
                      {team1.map((player, index) => (
                        <div
                          key={index}
                          onClick={() => tradeMode && handleTrade('team1', index)}
                          className={`p-3 rounded mb-2 transition ${
                            tradeMode ? 'cursor-pointer hover:bg-blue-700' : ''
                          } ${
                            selectedForTrade?.team === 'team1' && selectedForTrade?.playerIndex === index
                              ? 'bg-yellow-600'
                              : player.name === currentUser ? 'bg-blue-700 border-2 border-yellow-400' : 'bg-blue-800'
                          }`}
                        >
                          <div className="font-bold">{player.assignedPosition}</div>
                          <div className="flex items-center gap-2">
                            {player.name}
                            {player.name === currentUser && <span className="text-yellow-400 text-sm">(나)</span>}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-red-900 rounded-lg p-4">
                      <h4 className="text-xl font-bold mb-3">{team2Name}</h4>
                      {team2.map((player, index) => (
                        <div
                          key={index}
                          onClick={() => tradeMode && handleTrade('team2', index)}
                          className={`p-3 rounded mb-2 transition ${
                            tradeMode ? 'cursor-pointer hover:bg-red-700' : ''
                          } ${
                            selectedForTrade?.team === 'team2' && selectedForTrade?.playerIndex === index
                              ? 'bg-yellow-600'
                              : player.name === currentUser ? 'bg-red-700 border-2 border-yellow-400' : 'bg-red-800'
                          }`}
                        >
                          <div className="font-bold">{player.assignedPosition}</div>
                          <div className="flex items-center gap-2">
                            {player.name}
                            {player.name === currentUser && <span className="text-yellow-400 text-sm">(나)</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={startNextGame}
                    className="w-full mt-6 py-4 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-lg transition"
                  >
                    다음 게임 시작
                  </button>
                </div>
              </div>
            )}

            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <FileText size={24} />
                경기 기록
              </h3>
              {matchHistory.length === 0 ? (
                <p className="text-gray-400">아직 기록된 경기가 없습니다.</p>
              ) : (
                <div className="space-y-4">
                  {matchHistory.map((game, index) => (
                    <div key={index} className="bg-slate-700 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-xl font-bold">게임 {game.gameNumber}</h4>
                        <div className="text-lg font-bold">
                          {team1Name} {game.team1Wins} : {game.team2Wins} {team2Name}
                        </div>
                      </div>
                      
                      <div className={`inline-block px-3 py-1 rounded font-bold mb-3 ${
                        game.winner === 'team1' ? 'bg-blue-600' : 'bg-red-600'
                      }`}>
                        승리팀: {game.winner === 'team1' ? team1Name : team2Name}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <h5 className="font-bold text-blue-400 mb-2">{team1Name} 구성</h5>
                          {game.team1.map((player, i) => (
                            <div key={i} className="text-sm bg-blue-900 p-2 rounded mb-1">
                              {player.assignedPosition}: {player.name}
                            </div>
                          ))}
                        </div>
                        <div>
                          <h5 className="font-bold text-red-400 mb-2">{team2Name} 구성</h5>
                          {game.team2.map((player, i) => (
                            <div key={i} className="text-sm bg-red-900 p-2 rounded mb-1">
                              {player.assignedPosition}: {player.name}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <h5 className="font-bold text-sm mb-1">{team1Name} 밴/픽</h5>
                          <div className="text-sm bg-slate-600 p-2 rounded">
                            <div>밴: {game.team1Bans.join(', ') || '없음'}</div>
                            <div>픽: {game.team1Picks.join(', ') || '없음'}</div>
                          </div>
                        </div>
                        <div>
                          <h5 className="font-bold text-sm mb-1">{team2Name} 밴/픽</h5>
                          <div className="text-sm bg-slate-600 p-2 rounded">
                            <div>밴: {game.team2Bans.join(', ') || '없음'}</div>
                            <div>픽: {game.team2Picks.join(', ') || '없음'}</div>
                          </div>
                        </div>
                      </div>

                      {game.trades && game.trades.length > 0 && (
                        <div>
                          <h5 className="font-bold text-yellow-400 mb-2">트레이드 내역</h5>
                          {game.trades.map((trade, i) => (
                            <div key={i} className="text-sm bg-yellow-900 p-2 rounded mb-1">
                              {trade.from} ↔ {trade.to}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'matchComplete' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-yellow-600 to-yellow-800 rounded-lg p-8 text-center">
              <Trophy className="mx-auto mb-4" size={64} />
              <h2 className="text-4xl font-bold mb-2">경기 종료!</h2>
              <p className="text-2xl font-bold">{matchWinner} 최종 승리!</p>
              <p className="text-xl mt-4">최종 스코어: {team1Name} {team1Wins} : {team2Wins} {team2Name}</p>
            </div>

            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-2xl font-bold mb-4">전체 경기 기록</h3>
              <div className="space-y-4">
                {matchHistory.map((game, index) => (
                  <div key={index} className="bg-slate-700 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xl font-bold">게임 {game.gameNumber}</h4>
                      <div className={`px-3 py-1 rounded font-bold ${
                        game.winner === 'team1' ? 'bg-blue-600' : 'bg-red-600'
                      }`}>
                        {game.winner === 'team1' ? team1Name : team2Name} 승리
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-bold text-blue-400 mb-2">{team1Name}</h5>
                        {game.team1.map((player, i) => (
                          <div key={i} className="text-sm bg-blue-900 p-2 rounded mb-1">
                            {player.assignedPosition}: {player.name}
                          </div>
                        ))}
                        <div className="text-sm bg-slate-600 p-2 rounded mt-2">
                          <div>밴: {game.team1Bans.join(', ') || '없음'}</div>
                          <div>픽: {game.team1Picks.join(', ') || '없음'}</div>
                        </div>
                      </div>
                      <div>
                        <h5 className="font-bold text-red-400 mb-2">{team2Name}</h5>
                        {game.team2.map((player, i) => (
                          <div key={i} className="text-sm bg-red-900 p-2 rounded mb-1">
                            {player.assignedPosition}: {player.name}
                          </div>
                        ))}
                        <div className="text-sm bg-slate-600 p-2 rounded mt-2">
                          <div>밴: {game.team2Bans.join(', ') || '없음'}</div>
                          <div>픽: {game.team2Picks.join(', ') || '없음'}</div>
                        </div>
                      </div>
                    </div>

                    {game.trades && game.trades.length > 0 && (
                      <div className="mt-3">
                        <h5 className="font-bold text-yellow-400 mb-2">트레이드</h5>
                        {game.trades.map((trade, i) => (
                          <div key={i} className="text-sm bg-yellow-900 p-2 rounded mb-1">
                            {trade.from} ↔ {trade.to}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={resetMatch}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-xl transition"
            >
              새로운 내전 시작하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoLTeamMaker;