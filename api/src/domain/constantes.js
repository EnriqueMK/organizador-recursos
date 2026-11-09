export const PERFIS = ['SOLICITANTE', 'RESPONSAVEL', 'ADMINISTRADOR'];
export const TIPOS_RECURSO = ['SALA', 'LABORATORIO', 'EQUIPAMENTO', 'AUDITORIO'];
export const ESTADOS = ['SOLICITADA', 'APROVADA', 'EM_USO', 'CONCLUIDA', 'REJEITADA', 'CANCELADA', 'NAO_COMPARECEU'];

/** Estados que ocupam o recurso e a agenda de quem reservou. */
export const ATIVAS = ['SOLICITADA', 'APROVADA', 'EM_USO'];
/** Estados que contam como uso efetivo no relatório de utilização. */
export const COM_USO = ['APROVADA', 'EM_USO', 'CONCLUIDA'];

export const ehGestor = (perfil) => perfil === 'RESPONSAVEL' || perfil === 'ADMINISTRADOR';
