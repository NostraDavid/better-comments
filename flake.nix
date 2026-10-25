{
  description = "Development tools for Better Comments by NostraDavid";

  # Nixpkgs 26.05 retains Intel macOS support.
  inputs.nixpkgs.url = "github:nixos/nixpkgs/da6dc0e7b26060f2f71ce3ef7088fb56ee44fa36";

  outputs =
    { nixpkgs, ... }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      devShells = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          default = pkgs.mkShellNoCC {
            packages = with pkgs; [
              git
              just
              nodejs_24
              dprint
              oxlint
              prek
              nixfmt
              statix
              deadnix
              actionlint
              shellcheck
            ];
          };
        }
      );
      formatter = forAllSystems (system: nixpkgs.legacyPackages.${system}.nixfmt);
    };
}
