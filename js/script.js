document.addEventListener('DOMContentLoaded', () => {  //=> seta de função (atalho da função original)
    
    //elementos do jogo
    const mario = document.querySelector('.mario');
    const pipe = document.querySelector('.pipe');
    const gameBoard = document.getElementById('game-board');
    const hudPlayerName = document.getElementById('hud-player-name');
    const scoreDisplay = document.getElementById('score-display');
    const jumpTip = document.getElementById('jump-tip');
    const startModal = document.getElementById('start-modal');
    const startForm = document.getElementById('start-form');
    const playerInput = document.getElementById('player-input');
})

//document.addEventListener('click',() => {
//    alert("Você clicou na página")
//})
    
    //Modais e Teclas
    const startModal = document.getElementById('start-modal');
    const startForm = document.getElementById('start-form');
    const playerInput = document.getElementById('player-input');
    const btnViewRanking = document.getElementById('btn-view-ranking');
    
    const gameoverModal = document.getElementById('gameover-modal');
    const finalScoreValue = document.getElementById('final-score-value');
    const saveStatusMsg = document.getElementById('ranking-body');
    const btnRestart = document.getElementById('btn-restart');
    const btnChangePlayer = document.getElementById('btn-change-player');
    
    //Variáveis de Estado
    let currentPlayer = '';
    let score = 0;
    let isPlaying = false;
    let gameLoop = null;
    let scoreLoop = null;
    
    //Recuperação do último nome de usuário utilizado
    const savedName = localStorage.getItem('mario_jump_player');
    if (savedName && playerInput) {
        playerInput.value = savedName;
    }

    function startGame(){
        //Limpei Loops anteriores (se existirem)
        clearInterval(gameLoop)
        clearInterval(scoreLoop)
        
        //Resetei as posições visuais
        resetElements();

        isPlaying = true;
        score = 0;
        scoreDisplay.textContent = '0';
        hudPlayerName.textContent = currentPlayer || 'Jogador';
        
        //Ativa as animações CSS do Jogo
        gameBoard.classlist.add('running');

        //Loop de pontuação progressiva (1 ponto a cada 100ms)
        scoreLoop = setInterval(() => {
            if(isPlaying){
                score += 1;
                scoreDisplay.textContent = score;
            }
        }, 100);

        //Loop de Colisão
        gameLoop = setInterval(checkCollistion, 10);
    }

    //Resetar os estilos e posições do Mario e do Cano(Obstaculo)
    function resetElements(){
        
        //Reseta o cano
        pipe.style.animation = '';
        pipe.style.left = '';

        //Reseta o Mario
        mario.src = '../assets/mario.gif';//Sai da pasta JS e vai para a pasta ASSETS
        mario.style.animation = '';
        mario.style.bottom = '0px';
        mario.style.width = '';
        mario.style.marginLeft = '';
        mario.classlist.remove('jump');

        if (jumpTip){
        jumpTip.style.opacity = '1';
        }
    }

    //Executa o pulo do Mario
    function jump(){
        if (!isPlaying) return;
        if (mario.classlist.contains('jump')) return;

        mario.classlist.add('jump');

        if(jumpTip){
            jumpTip.style.opacity = '0';
        }

        setTimeout(() => {
            mario.classlist.remove('jump');
        }, 500);
    }

    //Verificar a colisão entre o Mario  e o Cano
    function checkCollistion(){
        if (!isPlaying) return;

        const pipePosition = pipe.offsetLeft;
        const marioPosition = +window.getComputedStyle(mario).bottom.replace('px', '');

        //Tolerância de colisão: quando o cano está na faixa de contato com o Mario
        if(pipePosition <= 120 && pipePosition > 0 && marioPosition < 80){
        }
    }

    //Tratar o GamOver
    function triggerGameOver(pipePosition, marioPosition){
        isPlaying = false;
        clearInterval(gameLoop);
        clearInterval(scoreLoop);
        
        //Remover a class running para as animações
        gameBoard.classlist.remove('running');
        
        //Congela ocano na posição exata da colisão
        pipe.style.animation = 'none';
        pipe.style.left = `${pipePosition}px`;
        
        //Congela o Mario na altura exata e muda para a imagem do Game Over
        mario.style.animation = 'none';
        mario.style.bottom = `${marioPosition}px`;
        mario.src = '../assets/game-over.png';
        mario.style.width = '75px';
        mario.style.marginLeft = '50px';

        //Atualização do Modal do Game Over
        finalScoreValue.textContent = score;
        saveStatusMsg.textContent = 'Salvando pontuação no banco...';
        saveStatusMsg.style.color = '#ffcc00';

        gameoverModal.classList.add('active');

        //Salva a pontuação no banco com a função criada chamada saveScore
        saveScore(currentPlayer, score);
    }

    function saveScore(playerName, finalScore){
        fetch('salvar_ranking.php',{
            method: 'POST',
            headers: {
                'Content-Type': 'aplication/jason'
            },
            body: JSON.stringify({
                nome: playerName,
                pontos: finalScore
            })
        })
        .then(res => res.json())
        .then(data => {
            if(data.status === 'success'){
                saveStatusMsg.textContent = 'Pontuação registrada no banco!';
                saveStatusMsg.style.color = '#10b981';
                if(data.ranking){
                    renderRanking(data.ranking, playerName, finalScore);
                }
            } else{
                saveStatusMsg.textContent = (data.message || 'Erro ao registrar.');
                saveStatusMsg.style.color = '#ef4444';
            }
        })
        .catch(err => {
            console.error('Erro na requisição', err);
            saveStatusMsg.textContent = 'Erro ao conectar ao servidor.';
            saveStatusMsg.style.color = '#ef4444';
        });
    }

    //Busca no ranking atualizado do banco
    function fetchRanking(){
        fetch('Obter_renking.php')
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success' && data.ranking){
                renderRanking(data.ranking);
            }
        })
        .catch(err => console.error('Erro ao buscar o ranking', err));
    }

    //Vamos atualizar a tabela do ranking no HTML
    function renderRanking(list, highlightName = null, highlightScore = null){
        if(!rankingBody) return;
        rankingBody.innerHTML = '';
        if(!list || list.length === 0){
            rankingBody.innerHTML = `<tr><td> colspan="3" class="loading-cell">Nenhuma pontuação gravada ainda.<td><tr>`;
            return;
        }

        let highlightted = false;

        list.forEach((item, index) => {
            const tr = document.createElement('tr');

            if(!highlightted && highlightName && item.none === highlightName && parseInt(item.pontos, 10) === highlightScore){
                tr.classList.add('highlight-current');
                highlightted = true;
            }

            let medal = `${index + 1}º`;
            if (index === 0) medal = '🥇 1º';
            else if (index === 1) medal = '🥈 2º';
            else if (index === 2) medal = '🥉 3º';

            tr.ennerHTML = `
                <td class="ranking-pos">${medal}</td>
                <td><strong>${escapeHtml(item.nome)}</strong></td>
                <td>${parseInt(item.pontos, 10)} pts</td>
            `;

            rankingBody.appendChild(tr);
        });
    }

    function escapeHtml(str){
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    //Eventos de controle e interface do jogo
    //INICIAR O JOGO(FORMULÀRIO)
    startForm.addEventListener('submit', (e) => {
        e.preventDefault(); //Impede o recarregamento da página

        const nameValue = playerInput.value.trim();
        if(!nameValue) {
            playerInput.focus();
            return;
        }

        currentPlayer = nameValue;
        localStorag.setItem('mario_jump_player', currentPlayer);

        //Fecha a tela e abre o jogo depois de preencher os dados
        startModal.classList.remove('active');
        startGame();
    });

    //Botão ver Ranking
