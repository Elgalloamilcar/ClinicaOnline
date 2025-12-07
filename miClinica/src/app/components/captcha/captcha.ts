import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Material Imports
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-captcha',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule],
  templateUrl: './captcha.html',
  styleUrl: './captcha.scss'
})
export class Captcha implements OnInit {
  @Output() captchaStatus = new EventEmitter<boolean>();

  code: string = '';
  userInput: string = '';
  isValid: boolean = false;

  constructor() { }

  ngOnInit() {
    this.generateCode();
  }

  generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.code = result;
    this.userInput = '';
    this.isValid = false;
    this.captchaStatus.emit(false);
  }

  validate() {
    if (this.userInput.toUpperCase() === this.code) {
      this.isValid = true;
    } else {
      this.isValid = false;
    }
    this.captchaStatus.emit(this.isValid);
  }
}