import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

class QRScannerScreen extends StatefulWidget {
  final Function(String) onScanned;

  const QRScannerScreen({super.key, required this.onScanned});

  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen> {
  bool _isProcessing = false;
  String? _errorMessage;
  final MobileScannerController controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.normal,
    facing: CameraFacing.back,
    torchEnabled: false,
  );
  bool _isTorchOn = false;

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  void _handleScannedCode(String scannedCode) {
    if (_isProcessing) return; // Prevent multiple processing

    setState(() {
      _isProcessing = true;
      _errorMessage = null;
    });

    try {
      print("QR Code scanned: $scannedCode");

      // Pass the scanned value back and pop
      widget.onScanned(scannedCode);

      // Delay to ensure the value is passed before navigation
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) {
          Navigator.pop(context, scannedCode);
        }
      });
    } catch (e) {
      setState(() {
        _isProcessing = false;
        _errorMessage = "Error processing QR code: $e";
        print("QR Error: $e");
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Scan QR Code"),
        backgroundColor: const Color(0xFF0000FF),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: Icon(_isTorchOn ? Icons.flash_off : Icons.flash_on),
            onPressed: () {
              setState(() {
                _isTorchOn = !_isTorchOn;
              });
              controller.toggleTorch();
            },
          ),
          IconButton(
            icon: const Icon(Icons.flip_camera_ios),
            onPressed: () => controller.switchCamera(),
          ),
        ],
      ),
      body: Stack(
        children: [
          // QR Scanner
          MobileScanner(
            controller: controller,
            onDetect: (barcodeCapture) {
              try {
                if (barcodeCapture.barcodes.isNotEmpty) {
                  final barcode = barcodeCapture.barcodes.first;
                  if (barcode.rawValue != null &&
                      barcode.rawValue!.isNotEmpty) {
                    final String scannedCode = barcode.rawValue!;
                    _handleScannedCode(scannedCode);
                  }
                }
              } catch (e) {
                print("Error in QR detection: $e");
                // Don't set error message here to avoid excessive UI updates
              }
            },
            errorBuilder: (context, error, child) {
              return Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.error, color: Colors.red, size: 64),
                    SizedBox(height: 12),
                    Text(
                      "Camera error: ${error.errorCode}",
                      style: TextStyle(color: Colors.white),
                    ),
                    SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: () => Navigator.pop(context),
                      child: Text("Go Back"),
                    ),
                  ],
                ),
              );
            },
          ),

          // Scanner overlay
          Center(
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                border: Border.all(
                  color: Colors.white,
                  width: 2.0,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),

          // Processing indicator
          if (_isProcessing)
            Container(
              color: Colors.black54,
              child: const Center(
                child: CircularProgressIndicator(
                  color: Colors.white,
                ),
              ),
            ),

          // Error message
          if (_errorMessage != null)
            Positioned(
              bottom: 20,
              left: 20,
              right: 20,
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.shade700,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  _errorMessage!,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),

          // Instructions
          Positioned(
            bottom: 50,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  "Position the QR code inside the frame",
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
