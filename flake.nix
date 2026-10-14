{
  description = "Outreach Desk: SvelteKit + SQLite dev environment";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { self, nixpkgs }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forAllSystems = f: nixpkgs.lib.genAttrs systems (system: f nixpkgs.legacyPackages.${system});
    in
    {
      devShells = forAllSystems (pkgs: {
        default = pkgs.mkShell {
          packages = [
            pkgs.nodejs_22     # Node 22 + npm (SvelteKit, Vite, Svelte 5)
            pkgs.python3       # needed by node-gyp to compile better-sqlite3
            pkgs.pkg-config
            pkgs.sqlite        # optional: sqlite3 CLI to inspect data/outreach.db
          ];
          # mkShell already provides a C/C++ compiler and make.

          # Build better-sqlite3 from source against Nix's own Node headers.
          # This avoids downloading prebuilt binaries, which do not run on NixOS.
          npm_config_build_from_source = "true";
          npm_config_nodedir = "${pkgs.nodejs_22}";

          shellHook = ''
            echo ""
            echo "Outreach Desk dev shell  (node $(node -v))"
            echo "  First time:  npm install && cp .env.example .env   (then edit .env)"
            echo "  Develop:     npm run dev"
            echo "  Production:  npm run build && npm start"
            echo "  Test:        npm run build && npm test"
            echo ""
          '';
        };
      });
    };
}
