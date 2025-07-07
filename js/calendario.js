document.addEventListener('DOMContentLoaded', async function() {
    const calendarEl = document.getElementById('calendar');
    const loaderEl = document.getElementById('calendar-loader');
    
    if (!calendarEl) {
        console.error("Elemento do calendário #calendar não encontrado.");
        loaderEl.textContent = "Erro: Div do calendário não encontrada.";
        return;
    }

    let eventos = [];
    try {
        // Busca os dados das visitas usando a função central do api.js
        const visitas = await getAllVisitas();
        if(visitas.error){
            throw new Error(visitas.error);
        }
        eventos = formatarVisitasParaCalendario(visitas);
    } catch (error) {
        console.error("Não foi possível carregar os eventos do calendário:", error);
        loaderEl.textContent = `Erro ao carregar eventos: ${error.message}. Verifique a planilha e o script.`;
        return; // Interrompe a execução se não conseguir buscar os dados
    }
    
    // Esconde o loader e mostra o calendário
    loaderEl.style.display = 'none';
    calendarEl.style.visibility = 'visible';

    const calendar = new FullCalendar.Calendar(calendarEl, {
        locale: 'pt-br',
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listYear'
        },
        events: eventos,
        eventClick: function(info) {
            const detalhes = `Pesqueiro: ${info.event.title}\n` +
                             `Data: ${info.event.start.toLocaleDateString('pt-BR')}\n\n` +
                             `Peixes Capturados:\n${info.event.extendedProps.peixes || 'Não registrado.'}\n\n` +
                             `Observações:\n${info.event.extendedProps.observacoes || 'Nenhuma.'}`;
            alert(detalhes);
        },
        eventDidMount: function(info) {
            info.el.title = `Clique para ver detalhes da visita ao ${info.event.title}`;
        }
    });

    calendar.render();
});

/**
 * Formata os dados das visitas para o formato que o FullCalendar entende.
 */
function formatarVisitasParaCalendario(visitas) {
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