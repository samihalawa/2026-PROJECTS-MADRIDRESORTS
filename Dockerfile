FROM apify/actor-node:22

ARG COOLIFY_URL=""
ARG COOLIFY_FQDN=""
ENV COOLIFY_URL=$COOLIFY_URL
ENV COOLIFY_FQDN=$COOLIFY_FQDN

COPY package.json ./
RUN npm install --omit=dev

COPY . ./

CMD ["sh", "-lc", "if [ \"${FBM_RUNTIME:-}\" = \"server\" ] || [ -n \"${COOLIFY_URL:-}\" ] || [ -n \"${COOLIFY_FQDN:-}\" ]; then npm run start:server; else npm start; fi"]
