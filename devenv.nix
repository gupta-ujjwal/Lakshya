{ pkgs, ... }: {
  languages.javascript.enable = true;
  languages.javascript.package = pkgs.nodejs_20;
  languages.javascript.pnpm.enable = true;

  services.postgres = {
    enable = true;
    port = 5432;
    package = pkgs.postgresql_16;
  };

  env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/lakshya?schema=public";

  dotenv.disableHint = true;

  enterShell = ''
    echo "Lakshya dev environment ready"
    echo "PostgreSQL running on port 5432"
    echo "Run 'pnpm install' then 'pnpm dev' to start"
  '';
}