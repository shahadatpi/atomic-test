FROM texlive/texlive:latest

# Install Node.js, ImageMagick, and fonts
RUN apt-get update && apt-get install -y \
    curl \
    imagemagick \
    fonts-recommended \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Allow ImageMagick PDF conversion
RUN sed -i 's/rights="none" pattern="PDF"/rights="read|write" pattern="PDF"/' \
    /etc/ImageMagick-6/policy.xml 2>/dev/null || \
    sed -i 's/rights="none" pattern="PDF"/rights="read|write" pattern="PDF"/' \
    /etc/ImageMagick-7/policy.xml 2>/dev/null || true

# Install Bengali fonts (Kalpurush + Siyam Rupali)
# These are needed for xelatex + polyglossia Bengali rendering
RUN mkdir -p /usr/share/fonts/truetype/bangla
COPY fonts/ /usr/share/fonts/truetype/bangla/
RUN fc-cache -fv

# Pre-generate font maps so xelatex doesn't do it at runtime
RUN mktexlsr && updmap-sys 2>/dev/null || true

WORKDIR /app
COPY package.json .
RUN npm install
COPY server.js .

EXPOSE 3001
CMD ["node", "server.js"]
