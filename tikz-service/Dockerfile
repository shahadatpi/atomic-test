FROM texlive/texlive:latest

RUN apt-get update && apt-get install -y \
    nodejs npm imagemagick \
    # Bengali / Unicode fonts
    fonts-beng \
    fonts-beng-extra \
    fonts-lohit-beng-bengali \
    fonts-noto \
    fonts-noto-cjk \
    fonts-freefont-ttf \
    fontconfig \
    && fc-cache -fv \
    && rm -rf /var/lib/apt/lists/*

# Allow ImageMagick to convert PDFs
RUN sed -i 's/rights="none" pattern="PDF"/rights="read|write" pattern="PDF"/' /etc/ImageMagick-6/policy.xml || true

# Install XeLaTeX Bengali support packages via tlmgr
RUN tlmgr update --self && \
    tlmgr install \
      polyglossia \
      xecyr \
      lm-math \
      fontspec \
      collection-fontsrecommended \
    || true

WORKDIR /app
COPY package.json .
RUN npm install
COPY server.js .

EXPOSE 3001
CMD ["node", "server.js"]
