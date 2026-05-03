{
  description = "Lakshya - NEET PG study tracker";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-parts.url = "github:hercules-ci/flake-parts";
    devenv.url = "github:cachix/devenv";
    devenv.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs = inputs @ { self, flake-parts, devenv, nixpkgs, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } ({
      imports = [
        devenv.flakeModule
      ];

      systems = [ "x86_64-linux" "aarch64-linux" ];

      perSystem = { config, pkgs, system, ... }: {
        devenv.shells.default = {
          imports = [ ./devenv.nix ];
          devenv.root = "/home/vishal/juspay/Playground/lakshya";
        };
      };
    });
}