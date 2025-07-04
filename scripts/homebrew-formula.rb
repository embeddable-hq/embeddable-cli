class Embed < Formula
  desc "CLI tool for Embeddable API"
  homepage "https://github.com/embeddable/cli"
  version "0.1.0"
  
  if OS.mac? && Hardware::CPU.arm?
    url "https://github.com/embeddable/cli/releases/download/v#{version}/embed-macos-arm64"
    sha256 "PLACEHOLDER_SHA256_MACOS_ARM64"
  elsif OS.mac? && Hardware::CPU.intel?
    url "https://github.com/embeddable/cli/releases/download/v#{version}/embed-macos-x64"
    sha256 "PLACEHOLDER_SHA256_MACOS_X64"
  elsif OS.linux? && Hardware::CPU.intel?
    url "https://github.com/embeddable/cli/releases/download/v#{version}/embed-linux-x64"
    sha256 "PLACEHOLDER_SHA256_LINUX_X64"
  elsif OS.linux? && Hardware::CPU.arm?
    url "https://github.com/embeddable/cli/releases/download/v#{version}/embed-linux-arm64"
    sha256 "PLACEHOLDER_SHA256_LINUX_ARM64"
  end

  def install
    bin.install "embed-macos-arm64" => "embed" if OS.mac? && Hardware::CPU.arm?
    bin.install "embed-macos-x64" => "embed" if OS.mac? && Hardware::CPU.intel?
    bin.install "embed-linux-x64" => "embed" if OS.linux? && Hardware::CPU.intel?
    bin.install "embed-linux-arm64" => "embed" if OS.linux? && Hardware::CPU.arm?
  end

  test do
    assert_match "CLI tool for Embeddable API", shell_output("#{bin}/embed --help")
  end
end