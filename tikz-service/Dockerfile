FROM texlive/texlive:latest

RUN apt-get update && apt-get install -y \
    nodejs npm imagemagick \
    && rm -rf /var/lib/apt/lists/*

# Allow ImageMagick to convert PDFs
RUN sed -i 's/rights="none" pattern="PDF"/rights="read|write" pattern="PDF"/' /etc/ImageMagick-6/policy.xml || true

WORKDIR /app
COPY package.json .
RUN npm install
COPY server.js .

EXPOSE 3001
CMD ["node", "server.js"]
