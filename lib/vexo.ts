import { customEvent } from "vexo-analytics";

export type paymentType = "registro_unico" | "plan"
export type loginType = "email" | "google" | "apple" | "huella" | "guest"


function contratar(id: number) {
    customEvent('contratar', { id });
}

function accept(id: string) {
    customEvent('aceptar_trabajo', { id });
}

function pago(type: paymentType, monto: number, currency = 'ARS') {
    customEvent('pago', {
        tipo: type,
        monto,
        currency
    });
}

function login(type: loginType) {
    customEvent('login', {
        tipo: type
    });
}

function servicio(nombre: string) {
    customEvent('servicio', {
        nombre
    });
}

export default {
    accept,
    pago,
    contratar,
    login,
    servicio,
}