FROM nginx:alpine

# Copiar archivos del frontend
COPY . /app

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto
EXPOSE 8080

# Iniciar nginx
CMD ["nginx", "-g", "daemon off;"]
