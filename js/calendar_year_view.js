// js/calendar_year_view.js

/**
 * Inicializa o FullCalendar na div #year-calendar com os eventos fornecidos.
 * Esta versão é mais robusta, adiando a renderização para evitar race conditions.
 * @param {Array} visitas - Um array de objetos de visita, já carregado da API.
 */
function initYearCalendar(visitas) {
    console.log("--- INICIANDO CALENDÁRIO ANUAL (VERSÃO ROBUSTA) ---");
    const calendarEl = document.getElementById('year-calendar');
    const loaderEl = document.getElementById('year-calendar-loading');

    if (!calendarEl || !loaderEl) {
        console.error("DEBUG: Elementos do calendário anual não encontrados.");
        return;
    }

    const events = formatVisitsForYearCalendar(visitas);
    console.log("DEBUG: Eventos para calendário anual formatados.", events);

    loaderEl.classList.add('hidden');
    calendarEl.style.visibility = 'visible';

    // Adia a renderização para o próximo ciclo de eventos da engine do JS.
    // Isso garante que o DOM esteja 'pronto' para receber o calendário.
    setTimeout(() => {
        try {
            const calendar = new FullCalendar.Calendar(calendarEl, {
                locale: 'pt-br',
                initialView: 'dayGridMonth',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,listYear'
                },
                events: events,
                eventClick: function(info) {
                    const detalhes = `Pesqueiro: ${info.event.title}\n` +
                                     `Data: ${info.event.start.toLocaleDateString('pt-BR')}\n` +
                                     `Peixes: ${info.event.extendedProps.peixes || 'Não registrado.'}\n` +
                                     `Obs: ${info.event.extendedProps.observacoes || 'Nenhuma.'}`;
                    alert(detalhes);
                },
                eventDidMount: function(info) {
                    info.el.title = `Clique para ver detalhes da visita ao ${info.event.title}`;
                }
            });

            calendar.render();
            console.log("--- CALENDÁRIO ANUAL RENDERIZADO COM SUCESSO ---");

        } catch (e) {
            // Se um erro ocorrer aqui, ele será capturado e logado de forma específica.
            console.error("ERRO CRÍTICO AO RENDERIZAR O FULLCALENDAR:", e);
            loaderEl.classList.remove('hidden'); // Mostra o loader novamente
            loaderEl.textContent = `Erro ao renderizar o calendário: ${e.message}`;
        }
    }, 0); // O timeout de 0ms é o suficiente para adiar a execução.
}

/**
 * Formata os dados das visitas para o formato que o FullCalendar entende.
 * (Esta função permanece a mesma)
 * @param {Array} visitas - O array de objetos de visita.
 * @returns {Array} Um array de eventos para o FullCalendar.
 */
function formatVisitsForYearCalendar(visitas) {
    if (!visitas || !Array.isArray(visitas)) {
        return [];
    }
    return visitas.map(visita => {
        return {
            title: visita.PesqueiroNome || 'Visita sem nome',
            start: visita.DataVisita,
            allDay: true,
            extendedProps: {
                observacoes: visita.Observacoes,
                peixes: visita.PeixesCapturados
            }
        };
    });
}