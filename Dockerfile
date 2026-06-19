FROM apify/actor-node:22

COPY package.json ./
RUN npm install --omit=dev

COPY . ./

CMD ["sh", "-lc", "if [ \"${FBM_RUNTIME:-}\" = \"server\" ] || [ -n \"${COOLIFY_URL:-}\" ] || [ -n \"${COOLIFY_FQDN:-}\" ]; then npm run start:server; else npm start; fi"]
