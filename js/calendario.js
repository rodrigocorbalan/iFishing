document.addEventListener('DOMContentLoaded', async function() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) {
        console.error("Elemento do calendário #calendar não encontrado.");
        return;
    }

    // Busca os dados das visitas usando a função central do api.js
    const visitas = await getAllVisitas();
    const eventos = formatarVisitasParaCalendario(visitas);

    const calendar = new FullCalendar.Calendar(calendarEl, {
        locale: 'pt-br', // Adiciona o idioma português
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listYear' // Adiciona a visualização de lista
        },
        events: eventos,
        eventClick: function(info) {
            // Cria uma string de detalhes mais completa para o alerta
            const detalhes = `Pesqueiro: ${info.event.title}\n` +
                             `Data: ${info.event.start.toLocaleDateString('pt-BR')}\n\n` +
                             `Peixes Capturados:\n${info.event.extendedProps.peixes || 'Não registrado.'}\n\n` +
                             `Observações:\n${info.event.extendedProps.observacoes || 'Nenhuma.'}`;
            alert(detalhes);
        },
        eventDidMount: function(info) {
            // Adiciona um tooltip (dica de ferramenta) ao evento no calendário
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
            title: visita.PesqueiroNome || 'Visita sem nome', // Usa o nome do pesqueiro que vem da API
            start: visita.DataVisita,
            allDay: true,
            extendedProps: { // Guarda informações extras
                observacoes: visita.Observacoes,
                peixes: visita.PeixesCapturados
            }
        };
    });
}